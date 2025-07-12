"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const Video_1 = require("../models/Video");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const videoModel = new Video_1.VideoModel(database_1.pool);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(__dirname, '../../uploads/videos');
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '100') * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp4|mov|avi|wmv|flv|webm/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only video files are allowed'));
        }
    }
});
router.post('/upload', auth_1.authenticateToken, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No video file uploaded' });
            return;
        }
        const userId = req.userId;
        const { title, description, category = 'real-estate', propertyType, location, price, tags, preferredCaption, preferredHashtags, preferredMusic, coolOffDays, } = req.body;
        const videoData = {
            userId,
            title: title || req.file.originalname.replace(/\.[^/.]+$/, ""),
            description: description || '',
            filename: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            category: category,
            propertyType: propertyType || 'house',
            location: location || '',
            price: price ? parseFloat(price) : undefined,
            tags: tags ? tags.split(',').map((tag) => tag.trim()) : [],
            preferredCaption,
            preferredHashtags: preferredHashtags ? preferredHashtags.split(',').map((tag) => tag.trim()) : [],
            preferredMusic,
            coolOffDays: coolOffDays ? parseInt(coolOffDays) : undefined,
        };
        const video = await videoModel.create(videoData);
        logger_1.logger.info(`Video uploaded: ${video.title} by user ${userId}`);
        res.status(201).json({
            message: 'Video uploaded successfully',
            video: {
                id: video.id,
                title: video.title,
                filename: video.filename,
                category: video.category,
                fileSize: video.fileSize,
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Video upload error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { category, isActive, limit, offset } = req.query;
        const videos = await videoModel.findByUser(userId, {
            category: category,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
        const stats = await videoModel.getVideoStats(userId);
        res.json({
            videos,
            stats,
        });
    }
    catch (error) {
        logger_1.logger.error('Get videos error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const videoId = req.params.id;
        if (!videoId) {
            res.status(400).json({ error: 'Video ID is required' });
            return;
        }
        const video = await videoModel.findById(videoId);
        if (!video) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        if (video.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        res.json(video);
        return;
    }
    catch (error) {
        console.error('Get video error:', error);
        res.status(500).json({ error: 'Failed to fetch video' });
        return;
    }
});
router.get('/:id/stream', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const videoId = req.params.id;
        if (!videoId) {
            res.status(400).json({ error: 'Video ID is required' });
            return;
        }
        const video = await videoModel.findById(videoId);
        if (!video || video.userId !== userId) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        const filePath = video.filePath;
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({ error: 'Video file not found' });
            return;
        }
        const stat = fs_1.default.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (!range) {
            res.status(400).json({ error: 'Range header is required' });
            return;
        }
        const parts = range.replace(/bytes=/, "").split("-");
        const firstPart = parts[0];
        if (!firstPart) {
            res.status(400).json({ error: 'Invalid range header' });
            return;
        }
        const start = parseInt(firstPart, 10);
        const end = parts[1] ? parseInt(parts[1], 10) : undefined;
        if (end === undefined) {
            const chunksize = (fileSize - start) + 1;
            const file = fs_1.default.createReadStream(filePath, { start, end: fileSize - 1 });
            const head = {
                'Content-Range': `bytes ${start}-${fileSize - 1}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
        }
        else {
            const chunksize = (end - start) + 1;
            const file = fs_1.default.createReadStream(filePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
        }
    }
    catch (error) {
        logger_1.logger.error('Video stream error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const videoId = req.params.id;
        if (!videoId) {
            res.status(400).json({ error: 'Video ID is required' });
            return;
        }
        const video = await videoModel.findById(videoId);
        if (!video || video.userId !== userId) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        const { title, description, preferredCaption, preferredHashtags, preferredMusic, coolOffDays, isActive, } = req.body;
        const updatedVideo = await videoModel.update(videoId, {
            title,
            description,
            preferredCaption,
            preferredHashtags: preferredHashtags ? preferredHashtags.split(',').map((tag) => tag.trim()) : undefined,
            preferredMusic,
            coolOffDays: coolOffDays ? parseInt(coolOffDays) : undefined,
            isActive,
        });
        if (!updatedVideo) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        logger_1.logger.info(`Video updated: ${updatedVideo.title} by user ${userId}`);
        res.json({
            message: 'Video updated successfully',
            video: updatedVideo,
        });
    }
    catch (error) {
        logger_1.logger.error('Update video error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const videoId = req.params.id;
        if (!videoId) {
            res.status(400).json({ error: 'Video ID is required' });
            return;
        }
        const video = await videoModel.findById(videoId);
        if (!video || video.userId !== userId) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        if (fs_1.default.existsSync(video.filePath)) {
            fs_1.default.unlinkSync(video.filePath);
        }
        if (video.thumbnailPath && fs_1.default.existsSync(video.thumbnailPath)) {
            fs_1.default.unlinkSync(video.thumbnailPath);
        }
        const deleted = await videoModel.delete(videoId);
        if (!deleted) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        logger_1.logger.info(`Video deleted: ${video.title} by user ${userId}`);
        res.json({ message: 'Video deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error('Delete video error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/next/:category', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const category = req.params.category;
        if (!['real-estate', 'cartoon'].includes(category)) {
            res.status(400).json({ error: 'Invalid category' });
            return;
        }
        const video = await videoModel.getNextVideoForPosting(userId, category);
        if (!video) {
            res.status(404).json({
                error: 'No videos available for posting',
                message: 'All videos have been posted recently. Add more videos or wait for the cool-off period.',
            });
            return;
        }
        res.json({
            video: {
                id: video.id,
                title: video.title,
                description: video.description,
                duration: video.duration,
                postCount: video.postCount,
                lastPostedAt: video.lastPostedAt,
                filename: video.filename,
                category: video.category,
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get next video error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/:id/mark-posted', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const videoId = req.params.id;
        if (!videoId) {
            res.status(400).json({ error: 'Video ID is required' });
            return;
        }
        const video = await videoModel.findById(videoId);
        if (!video || video.userId !== userId) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        const updatedVideo = await videoModel.markAsPosted(videoId);
        if (!updatedVideo) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        logger_1.logger.info(`Video marked as posted: ${updatedVideo.title} by user ${userId}`);
        res.json({
            message: 'Video marked as posted successfully',
            video: {
                id: updatedVideo.id,
                title: updatedVideo.title,
                postCount: updatedVideo.postCount,
                lastPostedAt: updatedVideo.lastPostedAt,
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Mark video posted error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await videoModel.getVideoStats(userId);
        res.json({ stats });
    }
    catch (error) {
        logger_1.logger.error('Get video stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=videos.js.map