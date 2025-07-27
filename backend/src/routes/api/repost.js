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
const express_1 = __importDefault(require("express"));
const smartRepostTrigger_1 = require("../../lib/repost/smartRepostTrigger");
const router = express_1.default.Router();
/**
 * GET /api/repost/status
 * Get current status of smart repost trigger system
 */
router.get('/status', async (req, res) => {
    try {
        console.log('📊 Getting Phase 7 repost trigger status...');
        const status = await smartRepostTrigger_1.smartRepostTrigger.getRepostTriggerStatus();
        res.json({
            success: true,
            data: status,
            message: 'Repost trigger status retrieved successfully'
        });
    }
    catch (error) {
        console.error('❌ Error getting repost status:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error getting repost status'
        });
    }
});
/**
 * POST /api/repost/trigger
 * Manually trigger repost check and execution
 */
router.post('/trigger', async (req, res) => {
    try {
        const { platform } = req.body; // Optional: 'youtube' | 'instagram'
        console.log(`🎯 Manual repost trigger requested for: ${platform || 'all platforms'}`);
        const results = await smartRepostTrigger_1.smartRepostTrigger.manualTrigger(platform);
        const summary = {
            totalTriggered: results.filter(r => r.triggered).length,
            platforms: results.map(r => ({
                platform: r.platform,
                triggered: r.triggered,
                newVideoCount: r.newVideoCount,
                repostsScheduled: r.repostsScheduled,
                candidates: r.repostCandidates.length
            }))
        };
        res.json({
            success: true,
            data: {
                results,
                summary
            },
            message: `Manual repost trigger completed. ${summary.totalTriggered} platform(s) triggered.`
        });
    }
    catch (error) {
        console.error('❌ Error in manual repost trigger:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error triggering reposts'
        });
    }
});
/**
 * POST /api/repost/scheduler/:action
 * Start or stop the repost trigger scheduler
 */
router.post('/scheduler/:action', async (req, res) => {
    try {
        const { action } = req.params; // 'start' | 'stop'
        if (action !== 'start' && action !== 'stop') {
            return res.status(400).json({
                success: false,
                error: 'Invalid action. Use "start" or "stop"'
            });
        }
        console.log(`🔄 ${action === 'start' ? 'Starting' : 'Stopping'} Phase 7 repost scheduler...`);
        if (action === 'start') {
            smartRepostTrigger_1.smartRepostTrigger.startTrigger();
        }
        else {
            smartRepostTrigger_1.smartRepostTrigger.stopTrigger();
        }
        const status = await smartRepostTrigger_1.smartRepostTrigger.getRepostTriggerStatus();
        res.json({
            success: true,
            data: {
                action,
                schedulerActive: status.schedulerActive
            },
            message: `Repost scheduler ${action === 'start' ? 'started' : 'stopped'} successfully`
        });
    }
    catch (error) {
        console.error(`❌ Error ${req.params.action}ing repost scheduler:`, error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : `Unknown error ${req.params.action}ing scheduler`
        });
    }
});
/**
 * GET /api/repost/candidates/:platform
 * Get eligible repost candidates for a platform
 */
router.get('/candidates/:platform', async (req, res) => {
    try {
        const { platform } = req.params;
        if (platform !== 'youtube' && platform !== 'instagram') {
            return res.status(400).json({
                success: false,
                error: 'Invalid platform. Use "youtube" or "instagram"'
            });
        }
        console.log(`📋 Getting repost candidates for ${platform}...`);
        // Use the private method via manual trigger to get candidates
        const results = await smartRepostTrigger_1.smartRepostTrigger.manualTrigger(platform);
        const platformResult = results.find(r => r.platform === platform);
        if (!platformResult) {
            return res.json({
                success: true,
                data: {
                    platform,
                    candidates: [],
                    eligibleCount: 0
                },
                message: `No repost candidates found for ${platform}`
            });
        }
        res.json({
            success: true,
            data: {
                platform,
                candidates: platformResult.repostCandidates,
                eligibleCount: platformResult.repostCandidates.length,
                newVideoCount: platformResult.newVideoCount,
                triggerReady: platformResult.newVideoCount >= 20
            },
            message: `Found ${platformResult.repostCandidates.length} repost candidates for ${platform}`
        });
    }
    catch (error) {
        console.error('❌ Error getting repost candidates:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error getting candidates'
        });
    }
});
/**
 * GET /api/repost/analytics
 * Get repost analytics and performance data
 */
router.get('/analytics', async (req, res) => {
    try {
        console.log('📈 Getting Phase 7 repost analytics...');
        const PostInsights = (await Promise.resolve().then(() => __importStar(require('../../models/PostInsights')))).default;
        const { VideoStatus } = await Promise.resolve().then(() => __importStar(require('../../models/VideoStatus')));
        // Get repost statistics
        const [totalReposted, youtubePosts, instagramPosts, recentReposts, averageScores] = await Promise.all([
            PostInsights.countDocuments({ reposted: true }),
            PostInsights.find({ platform: 'youtube', reposted: true }).countDocuments(),
            PostInsights.find({ platform: 'instagram', reposted: true }).countDocuments(),
            PostInsights.find({ reposted: true }).sort({ repostedAt: -1 }).limit(10).lean(),
            PostInsights.aggregate([
                { $match: { reposted: true } },
                { $group: {
                        _id: '$platform',
                        avgScore: { $avg: '$performanceScore' },
                        count: { $sum: 1 }
                    } }
            ])
        ]);
        // Get scheduled reposts from VideoStatus
        const scheduledReposts = await VideoStatus.find({
            'repostData.isRepost': true,
            status: 'ready'
        }).countDocuments();
        const analytics = {
            summary: {
                totalReposted,
                scheduledReposts,
                platforms: {
                    youtube: youtubePosts,
                    instagram: instagramPosts
                }
            },
            averageScores: averageScores.reduce((acc, item) => {
                acc[item._id] = {
                    averageScore: Math.round(item.avgScore * 100) / 100,
                    repostCount: item.count
                };
                return acc;
            }, {}),
            recentReposts: recentReposts.map((repost) => ({
                platform: repost.platform,
                videoId: repost.videoId,
                performanceScore: repost.performanceScore,
                originalPostDate: repost.originalPostDate,
                repostedAt: repost.repostedAt,
                caption: repost.caption.substring(0, 100) + '...'
            }))
        };
        res.json({
            success: true,
            data: analytics,
            message: 'Repost analytics retrieved successfully'
        });
    }
    catch (error) {
        console.error('❌ Error getting repost analytics:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error getting analytics'
        });
    }
});
exports.default = router;
