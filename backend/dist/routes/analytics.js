"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Post_1 = require("../models/Post");
const Video_1 = require("../models/Video");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const postModel = new Post_1.PostModel(database_1.pool);
const videoModel = new Video_1.VideoModel(database_1.pool);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
router.get('/overview', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { days = 30 } = req.query;
        const overview = await postModel.getAnalyticsOverview(userId, parseInt(days));
        res.json({ overview });
    }
    catch (error) {
        logger_1.logger.error('Get analytics overview error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/engagement', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { days = 30, platform } = req.query;
        const engagement = await postModel.getEngagementMetrics(userId, {
            days: parseInt(days),
            platform: platform,
        });
        res.json({ engagement });
    }
    catch (error) {
        logger_1.logger.error('Get engagement metrics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/best-times', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { days = 90 } = req.query;
        const bestTimes = await postModel.getBestPostingTimes(userId, parseInt(days));
        res.json({ bestTimes });
    }
    catch (error) {
        logger_1.logger.error('Get best times error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/hashtag-performance', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { days = 30 } = req.query;
        const hashtagPerformance = await postModel.getHashtagPerformance(userId, parseInt(days));
        res.json({ hashtagPerformance });
    }
    catch (error) {
        logger_1.logger.error('Get hashtag performance error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/video-performance', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { days = 30, category } = req.query;
        const videoPerformance = await postModel.getVideoPerformance(userId, {
            days: parseInt(days),
            category: category,
        });
        res.json({ videoPerformance });
    }
    catch (error) {
        logger_1.logger.error('Get video performance error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/growth', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { period = 'monthly' } = req.query;
        const growth = await postModel.getGrowthMetrics(userId, period);
        res.json({ growth });
    }
    catch (error) {
        logger_1.logger.error('Get growth metrics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/audience', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { days = 30 } = req.query;
        const audience = await postModel.getAudienceInsights(userId, parseInt(days));
        res.json({ audience });
    }
    catch (error) {
        logger_1.logger.error('Get audience insights error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/competitor', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { competitors = [] } = req.query;
        const competitorAnalysis = await postModel.getCompetitorAnalysis(userId, Array.isArray(competitors) ? competitors : [competitors]);
        res.json({ competitorAnalysis });
    }
    catch (error) {
        logger_1.logger.error('Get competitor analysis error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/reports', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { type = 'weekly', format = 'json' } = req.query;
        const report = await postModel.generateAnalyticsReport(userId, {
            type: type,
            format: format,
        });
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${new Date().toISOString().split('T')[0]}.csv`);
            res.send(report);
        }
        else if (format === 'pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
            res.send(report);
        }
        else {
            res.json({ report });
        }
    }
    catch (error) {
        logger_1.logger.error('Generate analytics report error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/export', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { startDate, endDate, format = 'json', includePosts = true, includeVideos = true } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        const exportData = await postModel.exportAnalyticsData(userId, {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            format: format,
            includePosts,
            includeVideos,
        });
        const filename = `analytics-export-${new Date().toISOString().split('T')[0]}.${format}`;
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(exportData);
        }
        else if (format === 'xlsx') {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(exportData);
        }
        else {
            res.json({ data: exportData });
        }
    }
    catch (error) {
        logger_1.logger.error('Export analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/insights', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { days = 30 } = req.query;
        const insights = await postModel.getAIInsights(userId, parseInt(days));
        res.json({ insights });
    }
    catch (error) {
        logger_1.logger.error('Get AI insights error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/trends', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { platform = 'instagram' } = req.query;
        const trends = await postModel.getTrendingTopics(userId, platform);
        res.json({ trends });
    }
    catch (error) {
        logger_1.logger.error('Get trends error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/performance-summary', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { days = 30 } = req.query;
        const summary = await postModel.getPerformanceSummary(userId, parseInt(days));
        res.json({ summary });
    }
    catch (error) {
        logger_1.logger.error('Get performance summary error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map