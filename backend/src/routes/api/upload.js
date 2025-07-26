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
const multer_1 = __importDefault(require("multer"));
const videoQueue_1 = require("../../services/videoQueue");
const VideoStatus_1 = require("../../models/VideoStatus");
const videoFingerprint_1 = require("../../lib/youtube/videoFingerprint");
const connection_1 = require("../../database/connection");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const router = express_1.default.Router();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow video files
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only video files are allowed'));
        }
    }
});
// Get settings from settings.json
function getSettings() {
    const settingsPath = path.resolve(__dirname, '../../../frontend/settings.json');
    if (fs.existsSync(settingsPath)) {
        try {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        }
        catch (e) {
            console.error('Failed to read settings.json:', e);
        }
    }
    return {};
}
// GET /api/upload/dropbox-status
// Get Dropbox monitoring statistics
router.get('/dropbox-status', async (req, res) => {
    try {
        await (0, connection_1.connectToDatabase)();
        // Get real stats from VideoStatus
        const totalUploaded = await VideoStatus_1.VideoStatus.countDocuments();
        const todayUploaded = await VideoStatus_1.VideoStatus.countDocuments({
            uploadDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        // Get stats from Dropbox monitor
        const dropboxMonitor = await Promise.resolve().then(() => __importStar(require('../../services/dropboxMonitor')));
        const monitorStats = dropboxMonitor.getMonitorStats();
        const stats = {
            totalFilesFound: monitorStats.totalFilesFound || totalUploaded,
            newFilesProcessed: monitorStats.newFilesProcessed || todayUploaded,
            duplicatesSkipped: monitorStats.duplicatesSkipped || 0,
            errors: monitorStats.errors || 0,
            lastCheck: monitorStats.lastCheck || new Date()
        };
        res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        console.error('Dropbox status error:', error);
        res.status(500).json({
            error: 'Failed to get Dropbox status',
            details: error.message
        });
    }
});
// POST /api/upload/scan-dropbox
// Manually trigger Dropbox folder scan
router.post('/scan-dropbox', async (req, res) => {
    try {
        console.log('Manual Dropbox scan requested');
        // Trigger actual Dropbox scan
        const dropboxMonitor = await Promise.resolve().then(() => __importStar(require('../../services/dropboxMonitor')));
        const stats = await dropboxMonitor.triggerManualScan();
        res.json({
            success: true,
            message: 'Dropbox scan completed',
            stats
        });
    }
    catch (error) {
        console.error('Manual Dropbox scan error:', error);
        res.status(500).json({
            error: 'Failed to scan Dropbox',
            details: error.message
        });
    }
});
// POST /api/upload/url
// Upload video from URL with repost detection
router.post('/url', async (req, res) => {
    try {
        await (0, connection_1.connectToDatabase)();
        const { url, platform = 'instagram' } = req.body;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'Valid video URL required' });
        }
        if (!['youtube', 'instagram'].includes(platform)) {
            return res.status(400).json({ error: 'Invalid platform. Must be youtube or instagram' });
        }
        // Validate URL format
        const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
        const isVideoUrl = videoExtensions.some(ext => url.toLowerCase().includes(ext));
        if (!isVideoUrl) {
            return res.status(400).json({
                error: 'Invalid video URL',
                details: 'URL must point to a video file (.mp4, .mov, .webm, etc.)'
            });
        }
        console.log(`Processing URL upload: ${url} (${platform})`);
        // For testing, simulate download
        const filename = url.split('/').pop() || `video-${Date.now()}.mp4`;
        const mockBuffer = Buffer.from('mock video data for testing');
        // Generate video fingerprint for repost detection
        const videoFingerprint = (0, videoFingerprint_1.generateVideoFingerprint)(mockBuffer, filename);
        console.log(`Generated fingerprint: ${videoFingerprint.hash.substring(0, 12)}... (${videoFingerprint.size} bytes)`);
        // Get repost settings
        const settings = getSettings();
        const minDaysBetweenPosts = settings.minDaysBetweenPosts || 20;
        // Check for duplicates using VideoStatus model
        const existingVideo = await VideoStatus_1.VideoStatus.findOne({
            'fingerprint.hash': videoFingerprint.hash
        }).sort({ lastPosted: -1 });
        if (existingVideo && existingVideo.lastPosted) {
            const daysSinceLastPost = Math.floor((Date.now() - existingVideo.lastPosted.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLastPost < minDaysBetweenPosts) {
                return res.status(409).json({
                    error: 'Duplicate video detected',
                    message: `This video was already posted ${daysSinceLastPost} days ago. Minimum repost interval is ${minDaysBetweenPosts} days.`,
                    lastPosted: existingVideo.lastPosted,
                    originalVideo: {
                        filename: existingVideo.filename,
                        postedAt: existingVideo.lastPosted,
                        daysSinceLastPost
                    },
                    minDaysBetweenPosts
                });
            }
        }
        // Generate unique video ID and simulate file storage
        const videoId = (0, uuid_1.v4)();
        const timestamp = Date.now();
        const savedFilename = `${timestamp}_url_${videoFingerprint.hash.substring(0, 8)}_${filename}`;
        // Create VideoStatus record
        const videoStatus = new VideoStatus_1.VideoStatus({
            videoId,
            platform,
            fingerprint: videoFingerprint,
            filename,
            filePath: url, // Store original URL as path for URL uploads
            uploadDate: new Date(),
            captionGenerated: false,
            posted: false,
            status: 'pending'
        });
        await videoStatus.save();
        // Also create VideoQueue record for backward compatibility
        const videoQueue = new videoQueue_1.VideoQueue({
            type: 'real_estate',
            dropboxUrl: url,
            filename,
            status: 'pending',
            uploadedAt: new Date(),
            videoHash: videoFingerprint.hash,
            videoSize: videoFingerprint.size,
            videoDuration: videoFingerprint.duration,
            platform,
            filePath: url
        });
        await videoQueue.save();
        res.json({
            success: true,
            message: 'Video URL processed successfully',
            videoId,
            filename,
            storageUrl: url,
            storageType: 'url',
            platform,
            sourceUrl: url,
            fingerprint: {
                hash: videoFingerprint.hash.substring(0, 12) + '...',
                size: videoFingerprint.size
            }
        });
    }
    catch (error) {
        console.error('URL upload error:', error);
        res.status(500).json({
            error: 'URL upload failed',
            details: error.message || 'Unknown error'
        });
    }
});
// POST /api/upload
// Bulk file upload with fingerprinting and de-dupe
router.post('/', upload.array('videos', 20), async (req, res) => {
    try {
        await (0, connection_1.connectToDatabase)();
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        const { platform = 'instagram' } = req.body;
        if (!['youtube', 'instagram'].includes(platform)) {
            return res.status(400).json({ error: 'Invalid platform. Must be youtube or instagram' });
        }
        const results = {
            uploaded: 0,
            duplicates: 0,
            errors: 0,
            details: []
        };
        // Get settings
        const settings = getSettings();
        const minDaysBetweenPosts = settings.minDaysBetweenPosts || 20;
        for (const file of files) {
            try {
                // Generate video fingerprint
                const fingerprint = (0, videoFingerprint_1.generateVideoFingerprint)(file.buffer, file.originalname);
                // Check for duplicates using VideoStatus model
                const existingVideo = await VideoStatus_1.VideoStatus.findOne({
                    'fingerprint.hash': fingerprint.hash
                }).sort({ lastPosted: -1 });
                if (existingVideo && existingVideo.lastPosted) {
                    const daysSinceLastPost = Math.floor((Date.now() - existingVideo.lastPosted.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSinceLastPost < minDaysBetweenPosts) {
                        results.duplicates++;
                        results.details.push({
                            filename: file.originalname,
                            status: 'duplicate',
                            message: `Video was posted ${daysSinceLastPost} days ago. Minimum interval is ${minDaysBetweenPosts} days.`,
                            lastPosted: existingVideo.lastPosted
                        });
                        continue;
                    }
                }
                // Save file to uploads directory
                const videoId = (0, uuid_1.v4)();
                const timestamp = Date.now();
                const filename = `${timestamp}_${fingerprint.hash.substring(0, 8)}_${file.originalname}`;
                const filePath = path.join(__dirname, '../../../uploads', filename);
                // Ensure uploads directory exists
                const uploadsDir = path.dirname(filePath);
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                // Write file to disk
                fs.writeFileSync(filePath, file.buffer);
                // Create VideoStatus record
                const videoStatus = new VideoStatus_1.VideoStatus({
                    videoId,
                    platform,
                    fingerprint,
                    filename: file.originalname,
                    filePath,
                    uploadDate: new Date(),
                    captionGenerated: false,
                    posted: false,
                    status: 'pending'
                });
                await videoStatus.save();
                // Also create VideoQueue record for backward compatibility
                const videoQueue = new videoQueue_1.VideoQueue({
                    type: 'real_estate',
                    dropboxUrl: filePath,
                    filename: file.originalname,
                    status: 'pending',
                    uploadedAt: new Date(),
                    videoHash: fingerprint.hash,
                    videoSize: fingerprint.size,
                    videoDuration: fingerprint.duration,
                    platform,
                    filePath
                });
                await videoQueue.save();
                results.uploaded++;
                results.details.push({
                    filename: file.originalname,
                    status: 'uploaded',
                    videoId,
                    fingerprint: {
                        hash: fingerprint.hash.substring(0, 12) + '...',
                        size: fingerprint.size
                    }
                });
            }
            catch (error) {
                console.error(`Error processing file ${file.originalname}:`, error);
                results.errors++;
                results.details.push({
                    filename: file.originalname,
                    status: 'error',
                    message: error.message
                });
            }
        }
        res.json({
            success: true,
            message: `Bulk upload completed: ${results.uploaded} uploaded, ${results.duplicates} duplicates, ${results.errors} errors`,
            results
        });
    }
    catch (error) {
        console.error('Bulk upload error:', error);
        res.status(500).json({
            error: 'Bulk upload failed',
            details: error.message
        });
    }
});
// GET /api/upload/queue
// Get current video queue
router.get('/queue', async (req, res) => {
    try {
        await (0, connection_1.connectToDatabase)();
        const limit = parseInt(req.query.limit) || 50;
        const videos = await videoQueue_1.VideoQueue.find()
            .sort({ uploadedAt: -1 })
            .limit(limit);
        res.json({
            success: true,
            videos,
            total: videos.length
        });
    }
    catch (error) {
        console.error('Queue fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch video queue',
            details: error.message
        });
    }
});
// GET /api/upload/status
// Get video upload status history
router.get('/status', async (req, res) => {
    try {
        await (0, connection_1.connectToDatabase)();
        const limit = parseInt(req.query.limit) || 50;
        const platform = req.query.platform;
        const query = platform ? { platform } : {};
        const statuses = await VideoStatus_1.VideoStatus.find(query)
            .sort({ uploadDate: -1 })
            .limit(limit);
        res.json({
            success: true,
            statuses,
            total: statuses.length
        });
    }
    catch (error) {
        console.error('Status fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch video statuses',
            details: error.message
        });
    }
});
exports.default = router;
