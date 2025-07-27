"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const finalPolish_1 = require("../../lib/youtube/finalPolish");
const VideoStatus_1 = require("../../models/VideoStatus");
const router = express_1.default.Router();
/**
 * POST /api/finalPolish/process
 * Apply final polish to a single video for specified platform
 */
router.post('/process', async (req, res) => {
    try {
        const { videoId, platform } = req.body;
        if (!videoId || !platform) {
            return res.status(400).json({
                success: false,
                error: 'videoId and platform are required'
            });
        }
        if (!['youtube', 'instagram'].includes(platform)) {
            return res.status(400).json({
                success: false,
                error: 'platform must be either "youtube" or "instagram"'
            });
        }
        console.log(`🎨 PHASE 8 API: Processing video ${videoId} for ${platform.toUpperCase()}`);
        const result = await (0, finalPolish_1.applyFinalPolish)(videoId, platform);
        return res.status(result.success ? 200 : 500).json({
            success: result.success,
            data: result,
            message: result.success
                ? `Video successfully polished for ${platform.toUpperCase()}`
                : 'Phase 8 processing failed'
        });
    }
    catch (error) {
        console.error('❌ PHASE 8 API Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            message: 'Internal server error during Phase 8 processing'
        });
    }
});
/**
 * POST /api/finalPolish/batch
 * Apply final polish to multiple videos for specified platform
 */
router.post('/batch', async (req, res) => {
    try {
        const { videoIds, platform } = req.body;
        if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'videoIds must be a non-empty array'
            });
        }
        if (!platform || !['youtube', 'instagram'].includes(platform)) {
            return res.status(400).json({
                success: false,
                error: 'platform must be either "youtube" or "instagram"'
            });
        }
        if (videoIds.length > 20) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 20 videos can be processed in a single batch'
            });
        }
        console.log(`🎨 PHASE 8 API: Batch processing ${videoIds.length} videos for ${platform.toUpperCase()}`);
        const results = await (0, finalPolish_1.batchFinalPolish)(videoIds, platform);
        const successCount = results.filter(r => r.success).length;
        return res.status(200).json({
            success: true,
            data: {
                results,
                summary: {
                    total: videoIds.length,
                    successful: successCount,
                    failed: videoIds.length - successCount,
                    platform: platform.toUpperCase()
                }
            },
            message: `Batch processing completed: ${successCount}/${videoIds.length} videos successfully polished`
        });
    }
    catch (error) {
        console.error('❌ PHASE 8 Batch API Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            message: 'Internal server error during batch Phase 8 processing'
        });
    }
});
/**
 * GET /api/finalPolish/status/:videoId
 * Get Phase 8 processing status for a specific video
 */
router.get('/status/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        if (!videoId) {
            return res.status(400).json({
                success: false,
                error: 'videoId is required'
            });
        }
        const status = await (0, finalPolish_1.getPhase8Status)(videoId);
        if (!status.found) {
            return res.status(404).json({
                success: false,
                error: 'Video not found',
                message: `Video ${videoId} does not exist in the database`
            });
        }
        return res.status(200).json({
            success: true,
            data: status,
            message: 'Phase 8 status retrieved successfully'
        });
    }
    catch (error) {
        console.error('❌ PHASE 8 Status API Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            message: 'Internal server error while retrieving Phase 8 status'
        });
    }
});
/**
 * GET /api/finalPolish/queue
 * Get list of videos ready for Phase 8 processing
 */
router.get('/queue', async (req, res) => {
    try {
        const { platform, limit = 10 } = req.query;
        const query = {
            status: { $in: ['pending', 'processing', 'ready'] },
            captionGenerated: false
        };
        // Add platform filter if specified
        if (platform && ['youtube', 'instagram'].includes(platform)) {
            query.platform = platform;
        }
        const videos = await VideoStatus_1.VideoStatus.find(query)
            .sort({ uploadDate: -1 })
            .limit(parseInt(limit))
            .select('videoId filename uploadDate platform status captionGenerated posted')
            .exec();
        return res.status(200).json({
            success: true,
            data: {
                videos,
                count: videos.length,
                filterApplied: {
                    platform: platform || 'all',
                    statuses: ['pending', 'processing', 'ready'],
                    captionGenerated: false
                }
            },
            message: `Found ${videos.length} videos ready for Phase 8 processing`
        });
    }
    catch (error) {
        console.error('❌ PHASE 8 Queue API Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            message: 'Internal server error while retrieving Phase 8 queue'
        });
    }
});
/**
 * GET /api/finalPolish/analytics
 * Get Phase 8 processing analytics and performance metrics
 */
router.get('/analytics', async (req, res) => {
    try {
        const { platform, days = 7 } = req.query;
        const dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - parseInt(days));
        // Build aggregation pipeline
        const matchStage = {
            uploadDate: { $gte: dateFilter }
        };
        if (platform && ['youtube', 'instagram'].includes(platform)) {
            matchStage.platform = platform;
        }
        const analytics = await VideoStatus_1.VideoStatus.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$platform',
                    totalVideos: { $sum: 1 },
                    readyForPolish: {
                        $sum: {
                            $cond: [
                                { $and: [
                                        { $in: ['$status', ['pending', 'processing', 'ready']] },
                                        { $eq: ['$captionGenerated', false] }
                                    ] },
                                1,
                                0
                            ]
                        }
                    },
                    polishCompleted: {
                        $sum: {
                            $cond: [
                                { $eq: ['$captionGenerated', true] },
                                1,
                                0
                            ]
                        }
                    },
                    posted: {
                        $sum: {
                            $cond: [
                                { $eq: ['$posted', true] },
                                1,
                                0
                            ]
                        }
                    },
                    failed: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'failed'] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        const summary = analytics.reduce((acc, curr) => {
            acc.totalVideos += curr.totalVideos;
            acc.readyForPolish += curr.readyForPolish;
            acc.polishCompleted += curr.polishCompleted;
            acc.posted += curr.posted;
            acc.failed += curr.failed;
            return acc;
        }, {
            totalVideos: 0,
            readyForPolish: 0,
            polishCompleted: 0,
            posted: 0,
            failed: 0
        });
        return res.status(200).json({
            success: true,
            data: {
                summary,
                byPlatform: analytics,
                period: {
                    days: parseInt(days),
                    from: dateFilter.toISOString(),
                    to: new Date().toISOString()
                }
            },
            message: 'Phase 8 analytics retrieved successfully'
        });
    }
    catch (error) {
        console.error('❌ PHASE 8 Analytics API Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            message: 'Internal server error while retrieving Phase 8 analytics'
        });
    }
});
/**
 * POST /api/finalPolish/detect-platform
 * Detect optimal platform for video content using AI analysis
 */
router.post('/detect-platform', async (req, res) => {
    try {
        const { videoId } = req.body;
        if (!videoId) {
            return res.status(400).json({
                success: false,
                error: 'videoId is required'
            });
        }
        const videoStatus = await VideoStatus_1.VideoStatus.findOne({ videoId });
        if (!videoStatus) {
            return res.status(404).json({
                success: false,
                error: 'Video not found'
            });
        }
        // Simple platform detection based on content analysis
        // This could be enhanced with more sophisticated AI analysis
        const filename = videoStatus.filename.toLowerCase();
        const title = videoStatus.filename.replace(/\.[^/.]+$/, "").toLowerCase();
        let platformRecommendation = 'instagram'; // Default to Instagram
        let confidence = 0.5;
        let reasoning = 'Default recommendation';
        // Basic content analysis for platform recommendation
        if (title.includes('property') || title.includes('home') || title.includes('realtor')) {
            if (title.includes('luxury') || title.includes('mansion') || title.includes('exclusive')) {
                platformRecommendation = 'instagram';
                confidence = 0.8;
                reasoning = 'Luxury content performs better on Instagram with visual storytelling';
            }
            else if (title.includes('guide') || title.includes('tips') || title.includes('how to')) {
                platformRecommendation = 'youtube';
                confidence = 0.7;
                reasoning = 'Educational content performs better on YouTube with longer format';
            }
            else {
                platformRecommendation = 'instagram';
                confidence = 0.6;
                reasoning = 'Real estate visual content optimized for Instagram engagement';
            }
        }
        return res.status(200).json({
            success: true,
            data: {
                videoId,
                recommendedPlatform: platformRecommendation,
                confidence,
                reasoning,
                alternativePlatform: platformRecommendation === 'instagram' ? 'youtube' : 'instagram'
            },
            message: `Platform recommendation: ${platformRecommendation.toUpperCase()} (${(confidence * 100).toFixed(1)}% confidence)`
        });
    }
    catch (error) {
        console.error('❌ PHASE 8 Platform Detection Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            message: 'Internal server error during platform detection'
        });
    }
});
exports.default = router;
