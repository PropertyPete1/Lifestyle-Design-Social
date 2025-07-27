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
exports.peakHoursScheduler = exports.PeakHoursScheduler = void 0;
const youtubeAnalyzer = __importStar(require("../youtube/analyzePeakHours"));
const instagramAnalyzer = __importStar(require("../instagram/analyzePeakHours"));
const PeakEngagementTimes_1 = __importDefault(require("../../models/PeakEngagementTimes"));
const cron = __importStar(require("node-cron"));
class PeakHoursScheduler {
    constructor() {
        this.isRunning = false;
        this.cronJob = null;
        this.schedulerActive = false;
        this.setupCronJob();
    }
    setupCronJob() {
        // Run analysis daily at 2 AM
        this.cronJob = cron.schedule('0 2 * * *', async () => {
            if (!this.isRunning) {
                await this.runFullAnalysis();
            }
        });
        this.cronJob.stop(); // Start stopped, will be started manually
    }
    startScheduler() {
        if (this.cronJob) {
            this.cronJob.start();
            this.schedulerActive = true;
            console.log('🕒 Peak Hours Scheduler started - will run daily at 2 AM');
        }
    }
    stopScheduler() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.schedulerActive = false;
            console.log('🛑 Peak Hours Scheduler stopped');
        }
    }
    async runFullAnalysis() {
        if (this.isRunning) {
            console.log('⚠️ Peak hours analysis already running, skipping...');
            return;
        }
        this.isRunning = true;
        console.log('🚀 Starting full peak hours analysis...');
        try {
            // Run both platform analyses in parallel
            const [youtubeResult, instagramResult] = await Promise.allSettled([
                youtubeAnalyzer.analyzePeakHours(),
                instagramAnalyzer.analyzePeakHours()
            ]);
            // Log results
            if (youtubeResult.status === 'fulfilled') {
                console.log('✅ YouTube peak hours analysis completed');
            }
            else {
                console.error('❌ YouTube peak hours analysis failed:', youtubeResult.reason);
            }
            if (instagramResult.status === 'fulfilled') {
                console.log('✅ Instagram peak hours analysis completed');
            }
            else {
                console.error('❌ Instagram peak hours analysis failed:', instagramResult.reason);
            }
            console.log('🎉 Full peak hours analysis completed');
        }
        catch (error) {
            console.error('❌ Error in peak hours analysis:', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    async runYouTubeAnalysis() {
        try {
            console.log('🎥 Running YouTube peak hours analysis...');
            await youtubeAnalyzer.analyzePeakHours();
            console.log('✅ YouTube analysis completed');
        }
        catch (error) {
            console.error('❌ YouTube analysis failed:', error);
            throw error;
        }
    }
    async runInstagramAnalysis() {
        try {
            console.log('📸 Running Instagram peak hours analysis...');
            await instagramAnalyzer.analyzePeakHours();
            console.log('✅ Instagram analysis completed');
        }
        catch (error) {
            console.error('❌ Instagram analysis failed:', error);
            throw error;
        }
    }
    async getOptimalTimes(platform, limit = 10) {
        try {
            if (platform) {
                if (platform === 'youtube') {
                    return await youtubeAnalyzer.getOptimalPostingTimes(platform, limit);
                }
                else {
                    return await instagramAnalyzer.getOptimalPostingTimes(platform, limit);
                }
            }
            // Get optimal times for both platforms
            const [youtubeTimes, instagramTimes] = await Promise.all([
                youtubeAnalyzer.getOptimalPostingTimes('youtube', limit),
                instagramAnalyzer.getOptimalPostingTimes('instagram', limit)
            ]);
            return {
                youtube: youtubeTimes,
                instagram: instagramTimes,
                combined: this.combinePlatformTimes(youtubeTimes, instagramTimes, limit)
            };
        }
        catch (error) {
            console.error('❌ Error getting optimal times:', error);
            return platform ? [] : { youtube: [], instagram: [], combined: [] };
        }
    }
    combinePlatformTimes(youtubeTimes, instagramTimes, limit) {
        // Combine and sort by average score across platforms
        const allTimes = new Map();
        // Add YouTube times
        youtubeTimes.forEach(time => {
            const key = `${time.dayOfWeek}-${time.hour}`;
            allTimes.set(key, {
                dayOfWeek: time.dayOfWeek,
                hour: time.hour,
                timeSlot: time.timeSlot,
                youtubeScore: time.score,
                instagramScore: 0,
                combinedScore: time.score / 2,
                platforms: ['youtube']
            });
        });
        // Add Instagram times
        instagramTimes.forEach(time => {
            const key = `${time.dayOfWeek}-${time.hour}`;
            if (allTimes.has(key)) {
                const existing = allTimes.get(key);
                existing.instagramScore = time.score;
                existing.combinedScore = (existing.youtubeScore + time.score) / 2;
                existing.platforms.push('instagram');
            }
            else {
                allTimes.set(key, {
                    dayOfWeek: time.dayOfWeek,
                    hour: time.hour,
                    timeSlot: time.timeSlot,
                    youtubeScore: 0,
                    instagramScore: time.score,
                    combinedScore: time.score / 2,
                    platforms: ['instagram']
                });
            }
        });
        return Array.from(allTimes.values())
            .sort((a, b) => b.combinedScore - a.combinedScore)
            .slice(0, limit);
    }
    async getAnalysisStatus() {
        try {
            const [youtubeCount, instagramCount] = await Promise.all([
                PeakEngagementTimes_1.default.countDocuments({ platform: 'youtube' }),
                PeakEngagementTimes_1.default.countDocuments({ platform: 'instagram' })
            ]);
            const lastUpdate = await PeakEngagementTimes_1.default
                .findOne({})
                .sort({ lastUpdated: -1 })
                .select('lastUpdated');
            return {
                isRunning: this.isRunning,
                schedulerActive: this.schedulerActive,
                dataPoints: {
                    youtube: youtubeCount,
                    instagram: instagramCount,
                    total: youtubeCount + instagramCount
                },
                lastUpdate: (lastUpdate === null || lastUpdate === void 0 ? void 0 : lastUpdate.lastUpdated) || null,
                nextScheduledRun: '2:00 AM daily'
            };
        }
        catch (error) {
            console.error('❌ Error getting analysis status:', error);
            return {
                isRunning: this.isRunning,
                schedulerActive: false,
                dataPoints: { youtube: 0, instagram: 0, total: 0 },
                lastUpdate: null,
                nextScheduledRun: '2:00 AM daily',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    isAnalysisRunning() {
        return this.isRunning;
    }
}
exports.PeakHoursScheduler = PeakHoursScheduler;
// Export singleton instance
exports.peakHoursScheduler = new PeakHoursScheduler();
