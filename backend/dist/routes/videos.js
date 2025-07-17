"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const Video_1 = require("../models/Video");
const database_1 = require("../config/database");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadPath = path_1.default.join(__dirname, '../../uploads/videos');
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'video-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
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
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        await (0, database_1.connectToDatabase)();
        const videos = await Video_1.Video.find({ userId }).sort({ createdAt: -1 });
        return res.json({
            success: true,
            data: videos
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting videos:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get videos'
        });
    }
});
router.post('/upload', upload.single('video'), async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No video file provided'
            });
        }
        await (0, database_1.connectToDatabase)();
        const { title, description, category = 'real-estate' } = req.body;
        const video = new Video_1.Video({
            userId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            title: title || req.file.originalname,
            description: description || '',
            category,
            status: 'uploaded'
        });
        await video.save();
        return res.status(201).json({
            success: true,
            data: video,
            message: 'Video uploaded successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error uploading video:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to upload video'
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        await (0, database_1.connectToDatabase)();
        const video = await Video_1.Video.findOne({ _id: id, userId });
        if (!video) {
            return res.status(404).json({
                success: false,
                error: 'Video not found'
            });
        }
        return res.json({
            success: true,
            data: video
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting video:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get video'
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        await (0, database_1.connectToDatabase)();
        const { title, description, category } = req.body;
        const video = await Video_1.Video.findOneAndUpdate({ _id: id, userId }, { title, description, category, updatedAt: new Date() }, { new: true });
        if (!video) {
            return res.status(404).json({
                success: false,
                error: 'Video not found'
            });
        }
        return res.json({
            success: true,
            data: video,
            message: 'Video updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating video:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update video'
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        await (0, database_1.connectToDatabase)();
        const video = await Video_1.Video.findOne({ _id: id, userId });
        if (!video) {
            return res.status(404).json({
                success: false,
                error: 'Video not found'
            });
        }
        if (video.filePath && fs_1.default.existsSync(video.filePath)) {
            fs_1.default.unlinkSync(video.filePath);
        }
        await Video_1.Video.findByIdAndDelete(id);
        return res.json({
            success: true,
            message: 'Video deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting video:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete video'
        });
    }
});
exports.default = router;
//# sourceMappingURL=videos.js.map