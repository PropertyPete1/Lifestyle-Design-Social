"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const cameraRollService_1 = __importDefault(require("../services/cameraRollService"));
const cartoonService_1 = __importDefault(require("../services/cartoonService"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const cameraRollService = new cameraRollService_1.default();
const cartoonService = new cartoonService_1.default();
router.post('/scan-camera-roll', auth_1.authenticateToken, async (req, res) => {
    try {
        const { targetCount = 3 } = req.body;
        const userId = req.userId;
        const allVideos = await cameraRollService.scanCameraRoll(userId);
        const selectedVideos = await cameraRollService.aiSelectBestVideos(allVideos, targetCount);
        res.json({
            message: `Successfully selected ${selectedVideos.length} videos for auto-posting`,
            videos: selectedVideos.map(video => ({
                name: video.name,
                duration: video.duration,
                size: video.size,
                resolution: `${video.width}x${video.height}`,
                aiScore: video.aiScore,
                hasAudio: video.hasAudio
            }))
        });
    }
    catch (error) {
        console.error('Camera roll scan error:', error);
        res.status(500).json({ error: 'Failed to scan camera roll', details: error.message });
    }
});
router.post('/enable', auth_1.authenticateToken, async (req, res) => {
    try {
        const { cameraRollPath, postingTimes } = req.body;
        res.json({
            message: 'Auto-posting enabled successfully',
            settings: {
                enabled: true,
                cameraRollPath: cameraRollPath || process.env.CAMERA_ROLL_PATH,
                postingTimes: postingTimes || ['09:00', '12:00', '18:00']
            }
        });
    }
    catch (error) {
        console.error('Enable auto-posting error:', error);
        res.status(500).json({ error: 'Failed to enable auto-posting' });
    }
});
router.post('/disable', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            message: 'Auto-posting disabled successfully',
            settings: { enabled: false }
        });
    }
    catch (error) {
        console.error('Disable auto-posting error:', error);
        res.status(500).json({ error: 'Failed to disable auto-posting' });
    }
});
router.get('/status', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            enabled: false,
            cameraRollPath: process.env.CAMERA_ROLL_PATH,
            postingTimes: ['09:00', '12:00', '18:00'],
            nextPostTime: 'Auto-posting disabled'
        });
    }
    catch (error) {
        console.error('Get auto-posting status error:', error);
        res.status(500).json({ error: 'Failed to get auto-posting status' });
    }
});
router.post('/test-scan', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const allVideos = await cameraRollService.scanCameraRoll(userId);
        const selectedVideos = await cameraRollService.aiSelectBestVideos(allVideos, 5);
        res.json({
            message: `Found ${allVideos.length} total videos, ${selectedVideos.length} selected for posting`,
            totalVideos: allVideos.length,
            selectedVideos: selectedVideos.map(video => ({
                name: video.name,
                duration: video.duration,
                size: (video.size / 1024 / 1024).toFixed(2) + ' MB',
                resolution: `${video.width}x${video.height}`,
                aiScore: video.aiScore,
                hasAudio: video.hasAudio
            }))
        });
    }
    catch (error) {
        console.error('Test scan error:', error);
        res.status(500).json({ error: 'Failed to test scan camera roll', details: error.message });
    }
});
router.get('/next-video', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            video: {
                id: 'stub-video-1',
                title: 'Sample Real Estate Video',
                description: 'A beautiful home tour.',
                duration: 60,
                postCount: 2,
                lastPosted: new Date().toISOString(),
                fileName: 'video1.mp4'
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get next video' });
    }
});
router.post('/mark-video-posted', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            message: 'Video marked as posted successfully'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to mark video as posted' });
    }
});
router.get('/video-stats', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            stats: {
                totalVideos: 2,
                totalPosts: 5,
                avgPostsPerVideo: 2.5,
                unpostedVideos: 1,
                readyToRepost: 1
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get video stats' });
    }
});
router.get('/instagram-status', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            connected: false,
            setupInstructions: {
                step1: 'Connect your Instagram account to a Facebook Page',
                step2: 'Convert your Instagram account to a Business/Creator account',
                step3: 'Ensure your Facebook Page has the Instagram account connected',
                step4: 'The system will automatically detect the connection'
            },
            note: 'Instagram posting is optional - videos and cartoons will still be created and saved for manual posting'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get Instagram status' });
    }
});
router.post('/create-cartoon', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const cartoon = await cartoonService.createCompleteCartoon(userId);
        res.json({
            message: 'Cartoon created successfully',
            cartoon
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create cartoon' });
    }
});
router.get('/cartoon-stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = cartoonService.getCartoonStats();
        res.json({
            ...stats,
            message: `Created ${stats.totalCartoons} cartoons total`
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get cartoon stats' });
    }
});
router.get('/cartoons', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({ cartoons: [{ fileName: 'sample.mp4', url: '/api/autopost/cartoons/download/sample.mp4' }] });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to list cartoon videos' });
    }
});
router.get('/cartoons/download/:fileName', auth_1.authenticateToken, async (req, res) => {
    try {
        res.status(404).json({ error: 'File not found' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to download cartoon video' });
    }
});
exports.default = router;
//# sourceMappingURL=autoPost.js.map