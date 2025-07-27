"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartRepostTrigger = exports.SmartRepostTrigger = void 0;
const VideoStatus_1 = require("../../models/VideoStatus");
const PostInsights_1 = __importDefault(require("../../models/PostInsights"));
const prepareSmartCaption_1 = require("../youtube/prepareSmartCaption");
const scheduler_1 = require("../peakHours/scheduler");
const cron = __importStar(require("node-cron"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class SmartRepostTrigger {
    constructor() {
        this.isRunning = false;
        this.cronJob = null;
        this.TRIGGER_THRESHOLD = 20; // Trigger after 20 new videos
        this.MAX_REPOSTS_PER_TRIGGER = 3; // Max 1-3 reposts per trigger
        this.setupCronJob();
    }
    /**
     * Set up cron job to check for repost triggers every hour
     */
    setupCronJob() {
        // Check every hour for repost triggers
        this.cronJob = cron.schedule('0 */1 * * *', async () => {
            if (!this.isRunning) {
                await this.checkAndTriggerReposts();
            }
        });
        this.cronJob.start();
        console.log('🔄 Phase 7 Smart Repost Trigger started - checking hourly');
    }
    /**
     * Main function to check video counts and trigger reposts
     */
    async checkAndTriggerReposts() {
        if (this.isRunning) {
            console.log('⚠️ Smart repost trigger already running, skipping...');
            return [];
        }
        this.isRunning = true;
        console.log('🚀 Phase 7: Checking for smart repost triggers...');
        try {
            const results = [];
            // Check both platforms
            for (const platform of ['youtube', 'instagram']) {
                const result = await this.checkPlatformForRepostTrigger(platform);
                if (result.triggered) {
                    results.push(result);
                }
            }
            if (results.length > 0) {
                console.log(`✅ Phase 7: Triggered ${results.length} platform reposts`);
            }
            else {
                console.log('📊 Phase 7: No repost triggers needed at this time');
            }
            return results;
        }
        catch (error) {
            console.error('❌ Phase 7: Error in smart repost trigger:', error);
            return [];
        }
        finally {
            this.isRunning = false;
        }
    }
    /**
     * Check specific platform for repost trigger
     */
    async checkPlatformForRepostTrigger(platform) {
        try {
            // Count new videos since last repost trigger
            const lastTriggerDate = await this.getLastRepostTriggerDate(platform);
            const newVideoCount = await VideoStatus_1.VideoStatus.countDocuments({
                platform,
                uploadDate: { $gt: lastTriggerDate },
                status: { $in: ['ready', 'posted'] } // Only count successfully processed videos
            });
            console.log(`📊 ${platform.toUpperCase()}: ${newVideoCount} new videos since last trigger`);
            if (newVideoCount < this.TRIGGER_THRESHOLD) {
                return {
                    triggered: false,
                    platform,
                    newVideoCount,
                    repostCandidates: [],
                    repostsScheduled: 0
                };
            }
            console.log(`🎯 ${platform.toUpperCase()}: Triggering repost! ${newVideoCount} new videos reached threshold`);
            // Get best performing eligible videos for repost
            const repostCandidates = await this.getBestRepostCandidates(platform);
            if (repostCandidates.length === 0) {
                console.log(`⚠️ ${platform.toUpperCase()}: No eligible repost candidates found`);
                await this.updateLastRepostTriggerDate(platform); // Update trigger date anyway
                return {
                    triggered: true,
                    platform,
                    newVideoCount,
                    repostCandidates: [],
                    repostsScheduled: 0
                };
            }
            // Determine how many to repost (1-3 based on performance scores)
            const repostCount = this.calculateRepostCount(repostCandidates);
            const selectedCandidates = repostCandidates.slice(0, repostCount);
            // Process reposts
            const repostsScheduled = await this.processReposts(selectedCandidates, platform);
            // Update last trigger date
            await this.updateLastRepostTriggerDate(platform);
            return {
                triggered: true,
                platform,
                newVideoCount,
                repostCandidates: selectedCandidates,
                repostsScheduled
            };
        }
        catch (error) {
            console.error(`❌ Error checking ${platform} for reposts:`, error);
            return {
                triggered: false,
                platform,
                newVideoCount: 0,
                repostCandidates: [],
                repostsScheduled: 0
            };
        }
    }
    /**
     * Get best performing videos eligible for repost
     */
    async getBestRepostCandidates(platform) {
        try {
            // Get top performing videos that are eligible for repost
            const candidates = await PostInsights_1.default.find({
                platform,
                repostEligible: true,
                reposted: false,
                performanceScore: { $gte: 70 }, // Only high-performing content
                originalPostDate: {
                    $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // At least 30 days old
                }
            })
                .sort({ performanceScore: -1 })
                .limit(10) // Get top 10 candidates
                .lean();
            return candidates.map(candidate => ({
                _id: candidate._id.toString(),
                platform: candidate.platform,
                videoId: candidate.videoId,
                caption: candidate.caption,
                hashtags: candidate.hashtags,
                performanceScore: candidate.performanceScore,
                originalPostDate: candidate.originalPostDate,
                views: candidate.views,
                likes: candidate.likes,
                comments: candidate.comments
            }));
        }
        catch (error) {
            console.error(`❌ Error getting repost candidates for ${platform}:`, error);
            return [];
        }
    }
    /**
     * Calculate how many videos to repost (1-3) based on performance scores
     */
    calculateRepostCount(candidates) {
        if (candidates.length === 0)
            return 0;
        const averageScore = candidates.reduce((sum, c) => sum + c.performanceScore, 0) / candidates.length;
        // More reposts for higher average scores
        if (averageScore >= 90)
            return Math.min(3, candidates.length);
        if (averageScore >= 80)
            return Math.min(2, candidates.length);
        return 1;
    }
    /**
     * Process reposts: regenerate captions and schedule via Phase 6
     */
    async processReposts(candidates, platform) {
        let scheduledCount = 0;
        try {
            // Get OpenAI API key from settings
            const openaiApiKey = await this.getOpenAIApiKey();
            if (!openaiApiKey) {
                console.error('❌ OpenAI API key not found - cannot regenerate captions');
                return 0;
            }
            for (const candidate of candidates) {
                try {
                    console.log(`🔄 Processing repost for ${platform} video: ${candidate.videoId}`);
                    // Regenerate caption WITHOUT dashes
                    const newCaption = await this.regenerateCaptionForRepost(candidate, openaiApiKey, platform);
                    // Get optimal posting time from Phase 6
                    const optimalTimes = await scheduler_1.peakHoursScheduler.getOptimalTimes(platform, 5);
                    const bestTime = this.selectNextAvailableTime(optimalTimes[platform] || optimalTimes, platform);
                    if (!bestTime) {
                        console.log(`⚠️ No optimal posting time available for ${platform}`);
                        continue;
                    }
                    // Schedule the repost
                    await this.scheduleRepost({
                        ...candidate,
                        newCaption,
                        scheduledTime: bestTime
                    });
                    // Mark as reposted in database
                    await PostInsights_1.default.findByIdAndUpdate(candidate._id, {
                        reposted: true,
                        repostedAt: new Date()
                    });
                    scheduledCount++;
                    console.log(`✅ Scheduled repost for ${platform} video: ${candidate.videoId} at ${bestTime}`);
                }
                catch (error) {
                    console.error(`❌ Error processing repost for ${candidate.videoId}:`, error);
                }
            }
        }
        catch (error) {
            console.error('❌ Error processing reposts:', error);
        }
        return scheduledCount;
    }
    /**
     * Regenerate caption for repost with NO dashes
     */
    async regenerateCaptionForRepost(candidate, openaiApiKey, platform) {
        try {
            // Prepare original content structure
            const originalContent = {
                title: candidate.caption.split('\n')[0] || candidate.caption.substring(0, 100),
                description: candidate.caption,
                tags: candidate.hashtags.map(h => h.replace('#', ''))
            };
            // Generate new smart caption
            const smartCaption = await (0, prepareSmartCaption_1.prepareSmartCaption)(originalContent, openaiApiKey, platform);
            // Select best version and ensure NO dashes
            const bestVersion = [smartCaption.versionA, smartCaption.versionB, smartCaption.versionC]
                .sort((a, b) => b.score - a.score)[0];
            // Clean caption to remove ALL dashes
            const cleanCaption = this.removeDashesFromCaption(bestVersion.description);
            console.log(`🎨 Generated fresh caption for repost (score: ${bestVersion.score})`);
            return cleanCaption;
        }
        catch (error) {
            console.error('❌ Error regenerating caption:', error);
            // Return cleaned original caption as fallback
            return this.removeDashesFromCaption(candidate.caption);
        }
    }
    /**
     * Remove ALL dashes from caption text
     */
    removeDashesFromCaption(caption) {
        return caption
            .replace(/-/g, ' ') // Replace all dashes with spaces
            .replace(/\s+/g, ' ') // Clean up multiple spaces
            .trim();
    }
    /**
     * Select next available posting time from optimal times
     */
    selectNextAvailableTime(optimalTimes, platform) {
        var _a;
        if (!optimalTimes || optimalTimes.length === 0)
            return null;
        const now = new Date();
        const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        // Find next optimal time starting from today
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const checkDay = (today + dayOffset) % 7;
            const dayTimes = optimalTimes.filter(time => time.dayOfWeek === checkDay);
            for (const time of dayTimes) {
                const scheduledDate = new Date();
                scheduledDate.setDate(now.getDate() + dayOffset);
                scheduledDate.setHours(time.hour, 0, 0, 0);
                // Only schedule for future times
                if (scheduledDate > now) {
                    return scheduledDate;
                }
            }
        }
        // Fallback: schedule for tomorrow at the best overall time
        const fallbackTime = new Date();
        fallbackTime.setDate(now.getDate() + 1);
        fallbackTime.setHours(((_a = optimalTimes[0]) === null || _a === void 0 ? void 0 : _a.hour) || 10, 0, 0, 0);
        return fallbackTime;
    }
    /**
     * Schedule repost via existing posting system
     */
    async scheduleRepost(repostData) {
        try {
            // Add to video queue with repost flag
            const VideoStatus = (await Promise.resolve().then(() => __importStar(require('../../models/VideoStatus')))).VideoStatus;
            await VideoStatus.create({
                videoId: `repost_${repostData.videoId}_${Date.now()}`,
                platform: repostData.platform,
                captionGenerated: true,
                status: 'ready',
                fingerprint: {
                    hash: `repost_${repostData.videoId}`,
                    size: 0,
                    duration: 0
                },
                filename: `repost_${repostData.videoId}`,
                filePath: null, // Repost uses original video
                uploadDate: repostData.scheduledTime,
                repostData: {
                    originalVideoId: repostData.videoId,
                    originalCaption: repostData.caption,
                    newCaption: repostData.newCaption,
                    isRepost: true
                }
            });
            console.log(`📅 Repost scheduled for ${repostData.platform} at ${repostData.scheduledTime}`);
        }
        catch (error) {
            console.error('❌ Error scheduling repost:', error);
            throw error;
        }
    }
    /**
     * Get last repost trigger date for platform
     */
    async getLastRepostTriggerDate(platform) {
        try {
            const settingsPath = path_1.default.join(process.cwd(), 'backend', 'settings.json');
            if (fs_1.default.existsSync(settingsPath)) {
                const settings = JSON.parse(fs_1.default.readFileSync(settingsPath, 'utf8'));
                const triggerKey = `lastRepostTrigger_${platform}`;
                if (settings[triggerKey]) {
                    return new Date(settings[triggerKey]);
                }
            }
            // Default: 30 days ago for first run
            return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        catch (error) {
            console.error('❌ Error getting last trigger date:', error);
            return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
    }
    /**
     * Update last repost trigger date
     */
    async updateLastRepostTriggerDate(platform) {
        try {
            const settingsPath = path_1.default.join(process.cwd(), 'backend', 'settings.json');
            let settings = {};
            if (fs_1.default.existsSync(settingsPath)) {
                settings = JSON.parse(fs_1.default.readFileSync(settingsPath, 'utf8'));
            }
            const triggerKey = `lastRepostTrigger_${platform}`;
            settings[triggerKey] = new Date().toISOString();
            fs_1.default.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
            console.log(`✅ Updated last repost trigger date for ${platform}`);
        }
        catch (error) {
            console.error('❌ Error updating trigger date:', error);
        }
    }
    /**
     * Get OpenAI API key from settings
     */
    async getOpenAIApiKey() {
        try {
            const settingsPath = path_1.default.join(process.cwd(), 'backend', 'settings.json');
            if (fs_1.default.existsSync(settingsPath)) {
                const settings = JSON.parse(fs_1.default.readFileSync(settingsPath, 'utf8'));
                return settings.openaiApiKey || null;
            }
            return null;
        }
        catch (error) {
            console.error('❌ Error getting OpenAI API key:', error);
            return null;
        }
    }
    /**
     * Get current status of repost trigger system
     */
    async getRepostTriggerStatus() {
        try {
            const status = {
                isRunning: this.isRunning,
                schedulerActive: this.cronJob !== null,
                threshold: this.TRIGGER_THRESHOLD,
                maxRepostsPerTrigger: this.MAX_REPOSTS_PER_TRIGGER,
                platforms: {}
            };
            // Get status for each platform
            for (const platform of ['youtube', 'instagram']) {
                const lastTriggerDate = await this.getLastRepostTriggerDate(platform);
                const newVideoCount = await VideoStatus_1.VideoStatus.countDocuments({
                    platform,
                    uploadDate: { $gt: lastTriggerDate },
                    status: { $in: ['ready', 'posted'] }
                });
                const eligibleCount = await PostInsights_1.default.countDocuments({
                    platform,
                    repostEligible: true,
                    reposted: false,
                    performanceScore: { $gte: 70 }
                });
                status.platforms[platform] = {
                    newVideosSinceLastTrigger: newVideoCount,
                    videosUntilNextTrigger: Math.max(0, this.TRIGGER_THRESHOLD - newVideoCount),
                    lastTriggerDate,
                    eligibleRepostCandidates: eligibleCount,
                    nextTriggerReady: newVideoCount >= this.TRIGGER_THRESHOLD
                };
            }
            return status;
        }
        catch (error) {
            console.error('❌ Error getting repost trigger status:', error);
            return {
                isRunning: false,
                schedulerActive: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Manually trigger reposts for testing
     */
    async manualTrigger(platform) {
        console.log('🎯 Manual repost trigger initiated...');
        if (platform) {
            const result = await this.checkPlatformForRepostTrigger(platform);
            return [result];
        }
        else {
            return await this.checkAndTriggerReposts();
        }
    }
    /**
     * Stop the repost trigger system
     */
    stopTrigger() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            console.log('🛑 Phase 7 Smart Repost Trigger stopped');
        }
    }
    /**
     * Start the repost trigger system
     */
    startTrigger() {
        if (!this.cronJob) {
            this.setupCronJob();
        }
        else {
            this.cronJob.start();
        }
        console.log('🔄 Phase 7 Smart Repost Trigger started');
    }
}
exports.SmartRepostTrigger = SmartRepostTrigger;
// Export singleton instance
exports.smartRepostTrigger = new SmartRepostTrigger();
