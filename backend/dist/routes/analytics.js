"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = require("../utils/logger");
const analyticsService_1 = require("../services/analyticsService");
const router = express_1.default.Router();
router.get('/overview', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const analytics = await analyticsService_1.analyticsService.getUserAnalytics(userId);
        return res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting analytics overview:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get analytics overview'
        });
    }
});
router.get('/best-times', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const days = parseInt(req.query.days) || 30;
        const result = await analyticsService_1.analyticsService.getBestPostingTimes(userId, days);
        return res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting best posting times:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get best posting times'
        });
    }
});
router.get('/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const analytics = await analyticsService_1.analyticsService.getPostAnalytics(postId);
        if (!analytics) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }
        return res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting post analytics:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get post analytics'
        });
    }
});
router.get('/videos/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const analytics = await analyticsService_1.analyticsService.getVideoAnalytics(videoId);
        if (!analytics) {
            return res.status(404).json({
                success: false,
                error: 'Video not found'
            });
        }
        return res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting video analytics:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get video analytics'
        });
    }
});
router.post('/engagement', async (req, res) => {
    try {
        const { postId, metrics } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        if (!postId || !metrics) {
            return res.status(400).json({
                success: false,
                error: 'Post ID and metrics are required'
            });
        }
        await analyticsService_1.analyticsService.recordPostEngagement(postId, metrics);
        return res.json({
            success: true,
            message: 'Engagement metrics recorded successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error recording engagement metrics:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to record engagement metrics'
        });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map