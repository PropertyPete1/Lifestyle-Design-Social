"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const autoPostingService_1 = require("../services/autoPostingService");
const cartoonService_1 = require("../services/cartoonService");
const User_1 = require("../models/User");
const Video_1 = require("../models/Video");
const Post_1 = require("../models/Post");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/status', auth_1.authenticateToken, async (req, res) => {
    try {
        await (0, database_1.connectToDatabase)();
        const userId = req.user.id;
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const postingTimes = user.postingTimes || ['09:00', '13:00', '18:00'];
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        let nextPostTime = 'Not scheduled';
        for (const time of postingTimes) {
            const [hours, minutes] = time.split(':');
            const postTime = new Date(`${today}T${hours}:${minutes}:00`);
            if (postTime > now) {
                nextPostTime = postTime.toLocaleString();
                break;
            }
        }
        return res.json({
            enabled: user.autoPostingEnabled || false,
            postingTimes: postingTimes,
            nextPostTime: nextPostTime,
            timezone: user.timezone || 'UTC'
        });
    }
    catch (error) {
        logger_1.logger.error('Get auto-posting status error:', error);
        return res.status(500).json({ error: 'Failed to get auto-posting status' });
    }
});
router.post('/enable', auth_1.authenticateToken, async (req, res) => {
    try {
        await (0, database_1.connectToDatabase)();
        const userId = req.user.id;
        const { postingTimes } = req.body;
        await User_1.User.findByIdAndUpdate(userId, {
            autoPostingEnabled: true,
            postingTimes: postingTimes || ['09:00', '13:00', '18:00']
        });
        logger_1.logger.info(`Auto-posting enabled for user ${userId}`);
        return res.json({ message: 'Auto-posting enabled successfully' });
    }
    catch (error) {
        logger_1.logger.error('Enable auto-posting error:', error);
        return res.status(500).json({ error: 'Failed to enable auto-posting' });
    }
});
router.post('/disable', auth_1.authenticateToken, async (req, res) => {
    try {
        await (0, database_1.connectToDatabase)();
        const userId = req.user.id;
        await User_1.User.findByIdAndUpdate(userId, {
            autoPostingEnabled: false
        });
        logger_1.logger.info(`Auto-posting disabled for user ${userId}`);
        return res.json({ message: 'Auto-posting disabled successfully' });
    }
    catch (error) {
        logger_1.logger.error('Disable auto-posting error:', error);
        return res.status(500).json({ error: 'Failed to disable auto-posting' });
    }
});
router.post('/manual-post', auth_1.authenticateToken, async (req, res) => {
    try {
        await (0, database_1.connectToDatabase)();
        const userId = req.user.id;
        const result = await autoPostingService_1.autoPostingService.manualPost(userId);
        return res.json({
            success: true,
            message: 'Manual post triggered successfully',
            result
        });
    }
    catch (error) {
        logger_1.logger.error('Manual post error:', error);
        return res.status(500).json({ error: 'Failed to trigger manual post' });
    }
});
router.get('/video-stats', auth_1.authenticateToken, async (req, res) => {
    try {
        await (0, database_1.connectToDatabase)();
        const userId = req.user.id;
        const totalVideos = await Video_1.Video.countDocuments({ userId, isActive: true });
        const totalPosts = await Post_1.Post.countDocuments({ userId });
        const unpostedVideos = await Video_1.Video.countDocuments({ userId, isActive: true, postCount: 0 });
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const readyToRepost = await Video_1.Video.countDocuments({
            userId,
            isActive: true,
            lastPostedAt: { $lt: sevenDaysAgo }
        });
        return res.json({
            stats: {
                totalVideos,
                totalPosts,
                avgPostsPerVideo: totalVideos > 0 ? (totalPosts / totalVideos) : 0,
                unpostedVideos,
                readyToRepost
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get video stats error:', error);
        return res.status(500).json({ error: 'Failed to get video stats' });
    }
});
router.get('/next-video', auth_1.authenticateToken, async (req, res) => {
    try {
        await (0, database_1.connectToDatabase)();
        const userId = req.user.id;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const video = await Video_1.Video.findOne({
            userId,
            isActive: true,
            $or: [
                { lastPostedAt: null },
                { lastPostedAt: { $lt: sevenDaysAgo } }
            ]
        }).sort({ starred: -1, postCount: 1 });
        if (!video) {
            return res.json({ video: null, message: 'No videos available for posting' });
        }
        return res.json({
            video: {
                id: video._id,
                title: video.title,
                description: video.description,
                duration: video.duration,
                postCount: video.postCount,
                lastPosted: video.lastPostedAt,
                category: video.category
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get next video error:', error);
        return res.status(500).json({ error: 'Failed to get next video' });
    }
});
router.get('/settings', auth_1.authenticateToken, async (req, res) => {
    try {
        await (0, database_1.connectToDatabase)();
        const userId = req.user.id;
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({
            isAutoPostingEnabled: user.autoPostingEnabled || false,
            postingTimes: user.postingTimes || ['09:00', '13:00', '18:00'],
            timezone: user.timezone || 'UTC',
            testMode: user.testMode || false
        });
    }
    catch (error) {
        logger_1.logger.error('Get auto-post settings error:', error);
        return res.status(500).json({ error: 'Failed to get settings' });
    }
});
router.put('/settings', auth_1.authenticateToken, async (req, res) => {
    try {
        await (0, database_1.connectToDatabase)();
        const userId = req.user.id;
        const { isAutoPostingEnabled, postingTimes, timezone, testMode } = req.body;
        await User_1.User.findByIdAndUpdate(userId, {
            autoPostingEnabled: isAutoPostingEnabled,
            postingTimes: postingTimes || ['09:00', '13:00', '18:00'],
            timezone: timezone || 'UTC',
            testMode: testMode || false
        });
        logger_1.logger.info(`Auto-posting settings updated for user ${userId}`);
        return res.json({ message: 'Settings updated successfully' });
    }
    catch (error) {
        logger_1.logger.error('Update auto-post settings error:', error);
        return res.status(500).json({ error: 'Failed to update settings' });
    }
});
const cartoonService = new cartoonService_1.CartoonService();
router.post('/create-cartoon', auth_1.authenticateToken, async (req, res) => {
    try {
        await (0, database_1.connectToDatabase)();
        const userId = req.user.id;
        const cartoon = await cartoonService.createCompleteCartoon(userId);
        return res.json({
            success: true,
            cartoon: {
                title: cartoon.script.title,
                duration: cartoon.script.duration,
                videoPath: cartoon.video.path,
                caption: cartoon.caption,
                hashtags: cartoon.hashtags
            },
            message: 'Cartoon created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Create cartoon error:', error);
        return res.status(500).json({ error: 'Failed to create cartoon' });
    }
});
router.post('/create-sample-cartoon', async (_req, res) => {
    try {
        const cartoon = await cartoonService.createCompleteCartoon('demo-user');
        return res.json({
            success: true,
            cartoon: {
                title: cartoon.script.title,
                duration: cartoon.script.duration,
                path: cartoon.video.path,
                caption: cartoon.caption,
                hashtags: cartoon.hashtags
            },
            message: 'Sample cartoon created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Create sample cartoon error:', error);
        return res.status(500).json({ error: 'Failed to create sample cartoon' });
    }
});
router.get('/cartoon-stats', async (_req, res) => {
    try {
        const stats = await cartoonService.getCartoonStats();
        return res.json({
            success: true,
            stats,
            message: 'Cartoon stats retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Get cartoon stats error:', error);
        return res.status(500).json({ error: 'Failed to get cartoon stats' });
    }
});
router.get('/cartoons', async (_req, res) => {
    try {
        const cartoons = await cartoonService.listCartoons();
        return res.json({
            success: true,
            cartoons: cartoons.map(filename => ({ fileName: filename, filename })),
            message: 'Cartoons retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Get cartoons error:', error);
        return res.status(500).json({ error: 'Failed to get cartoons' });
    }
});
router.get('/cartoons/download/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }
        const cartoonPath = path_1.default.join(process.cwd(), 'cartoons', filename);
        if (!fs_1.default.existsSync(cartoonPath)) {
            return res.status(404).json({ error: 'Cartoon file not found' });
        }
        const stat = fs_1.default.statSync(cartoonPath);
        const fileSize = stat.size;
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', fileSize.toString());
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        const fileStream = fs_1.default.createReadStream(cartoonPath);
        fileStream.pipe(res);
        logger_1.logger.info(`Downloaded cartoon: ${filename}`);
        return;
    }
    catch (error) {
        logger_1.logger.error('Download cartoon error:', error);
        return res.status(500).json({ error: 'Failed to download cartoon' });
    }
});
exports.default = router;
