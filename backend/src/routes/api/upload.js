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
const TopHashtags_1 = __importDefault(require("../../models/TopHashtags"));
const AudioMatch_1 = require("../../models/AudioMatch");
const router = express_1.default.Router();
// DEBUG: Simple route to test routing
router.get('/debug', (req, res) => {
    res.json({ message: 'DEBUG: Upload router is working!', timestamp: new Date().toISOString() });
});
// Simple test route
router.get('/simple-test', (req, res) => {
    res.json({ message: 'Simple test works!', timestamp: new Date().toISOString() });
});
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
        const repostSettings = (0, videoFingerprint_1.getRepostSettings)();
        const minDaysBetweenPosts = repostSettings.minDaysBeforeRepost;
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
        // Get repost settings
        const repostSettings = (0, videoFingerprint_1.getRepostSettings)();
        const minDaysBetweenPosts = repostSettings.minDaysBeforeRepost;
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
// GET /api/upload/phase1-status
// Test endpoint to verify Phase 1 functionality
router.get('/phase1-status', async (req, res) => {
    try {
        await (0, connection_1.connectToDatabase)();
        const repostSettings = (0, videoFingerprint_1.getRepostSettings)();
        const totalVideos = await VideoStatus_1.VideoStatus.countDocuments();
        const recentUploads = await VideoStatus_1.VideoStatus.find()
            .sort({ uploadDate: -1 })
            .limit(5)
            .select('filename platform uploadDate posted fingerprint.hash');
        res.json({
            success: true,
            phase1Status: {
                message: "✅ Phase 1 - Bulk Upload + Smart De-Dupe + Video Fingerprinting",
                features: {
                    bulkUpload: "✅ Drag-and-drop, multiple formats (mp4, mov, webm, avi, mkv)",
                    dropboxSync: "✅ Automated monitoring and file sync",
                    urlUpload: "✅ URL-based video download and processing",
                    videoFingerprinting: "✅ Hash-based duplicate detection",
                    repostCooldown: `✅ ${repostSettings.minDaysBeforeRepost}-day minimum between reposts`,
                    databaseStorage: "✅ MongoDB VideoStatus model with all required fields"
                },
                statistics: {
                    totalVideosTracked: totalVideos,
                    minDaysBeforeRepost: repostSettings.minDaysBeforeRepost,
                    recentUploads: recentUploads.length
                },
                recentUploads: recentUploads.map(video => {
                    var _a, _b;
                    return ({
                        filename: video.filename,
                        platform: video.platform,
                        uploadDate: video.uploadDate,
                        posted: video.posted,
                        fingerprintHash: ((_b = (_a = video.fingerprint) === null || _a === void 0 ? void 0 : _a.hash) === null || _b === void 0 ? void 0 : _b.substring(0, 12)) + '...'
                    });
                })
            }
        });
    }
    catch (error) {
        console.error('Phase 1 status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check Phase 1 status',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Test route to debug routing issues
router.get('/test-queue', async (req, res) => {
    res.json({ success: true, message: 'Test route works!', timestamp: new Date().toISOString() });
});
// PHASE 5: POST QUEUE - Get videos ready for auto-publish (enhanced with smart captions, hashtags, and audio matching)
router.get('/post-queue', async (req, res) => {
    try {
        await (0, connection_1.connectToDatabase)();
        // Get all videos ready for auto-publish (both Instagram and YouTube)
        const readyVideos = await VideoStatus_1.VideoStatus.find({
            status: { $in: ['ready', 'pending'] },
            posted: false
        }).sort({ uploadDate: -1 });
        console.log(`Found ${readyVideos.length} videos ready for post queue:`, readyVideos.map(v => `${v.filename} (${v.platform})`).join(', '));
        // Get settings for OpenAI API key
        const settings = getSettings();
        const openaiApiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;
        // Enhanced response with Phase 3 AudioMatch, Phase 4 Smart Captions, and TopHashtags integration
        const postQueueData = await Promise.all(readyVideos.map(async (video) => {
            try {
                // Phase 4: Generate smart captions using prepareSmartCaption
                let smartCaptionResult = null;
                let selectedCaption = null;
                if (openaiApiKey) {
                    try {
                        const { prepareSmartCaption } = await Promise.resolve().then(() => __importStar(require('../../lib/youtube/prepareSmartCaption')));
                        // Prepare original content for smart caption generation
                        const originalContent = {
                            title: video.filename.replace(/\.[^/.]+$/, "").replace(/-/g, " "), // Remove dashes as required
                            description: `Property showcase video: ${video.filename.replace(/-/g, " ")}`, // Remove dashes
                            tags: ['realestate', 'property', 'homes']
                        };
                        smartCaptionResult = await prepareSmartCaption(originalContent, openaiApiKey, video.platform);
                        // Auto-select best caption version based on highest GPT score
                        const captions = [smartCaptionResult.versionA, smartCaptionResult.versionB, smartCaptionResult.versionC];
                        selectedCaption = captions.reduce((best, current) => current.score > best.score ? current : best);
                        // Ensure selected caption has no dashes in title or description
                        if (selectedCaption) {
                            selectedCaption.title = selectedCaption.title.replace(/-/g, " ");
                            selectedCaption.description = selectedCaption.description.replace(/-/g, " ");
                        }
                    }
                    catch (captionError) {
                        console.error(`Error generating smart caption for ${video.filename}:`, captionError);
                    }
                }
                // Fallback caption if smart caption generation fails
                if (!selectedCaption) {
                    selectedCaption = {
                        title: video.filename.replace(/\.[^/.]+$/, "").replace(/-/g, " "), // Remove dashes
                        description: `Property showcase video: ${video.filename.replace(/-/g, " ")}`, // Remove dashes
                        type: 'fallback',
                        score: 75
                    };
                }
                // Get top-performing hashtags from TopHashtags model
                let performanceTags = ['#realestate', '#property', '#homes'];
                try {
                    const topHashtags = await TopHashtags_1.default.find({
                        platform: { $in: [video.platform, 'both'] }
                    })
                        .sort({ avgViewScore: -1 })
                        .limit(8)
                        .select('hashtag');
                    if (topHashtags.length > 0) {
                        performanceTags = topHashtags.map(tag => `#${tag.hashtag}`);
                    }
                }
                catch (hashtagError) {
                    console.error(`Error fetching top hashtags for ${video.filename}:`, hashtagError);
                }
                // Phase 3: Get audio match from AudioMatch model
                let audioMatch = null;
                try {
                    const matchedAudio = await AudioMatch_1.AudioMatch.findOne({
                        videoId: video.videoId,
                        platform: video.platform,
                        status: 'matched'
                    })
                        .sort({ 'matchingFactors.overallScore': -1 });
                    if (matchedAudio) {
                        audioMatch = {
                            title: matchedAudio.audioMetadata.title,
                            artist: matchedAudio.audioMetadata.artist || undefined,
                            score: matchedAudio.matchingFactors.overallScore,
                            category: matchedAudio.audioMetadata.category
                        };
                    }
                }
                catch (audioError) {
                    console.error(`Error fetching audio match for ${video.filename}:`, audioError);
                }
                return {
                    videoId: video.videoId,
                    videoPreview: `/uploads/${video.filename}`,
                    selectedCaption,
                    smartCaptionVersions: smartCaptionResult ? {
                        versionA: smartCaptionResult.versionA,
                        versionB: smartCaptionResult.versionB,
                        versionC: smartCaptionResult.versionC
                    } : null,
                    tags: performanceTags,
                    title: selectedCaption.title, // Use smart caption title
                    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Phase 6 placeholder: 2 hours from now
                    audioMatch,
                    uploadDate: video.uploadDate,
                    filename: video.filename,
                    platform: video.platform || 'youtube',
                    status: video.status
                };
            }
            catch (videoError) {
                console.error(`Error processing video ${video.filename} for post queue:`, videoError);
                // Return fallback data for failed videos
                return {
                    videoId: video.videoId,
                    videoPreview: `/uploads/${video.filename}`,
                    selectedCaption: {
                        title: video.filename.replace(/\.[^/.]+$/, "").replace(/-/g, " "), // Remove dashes
                        description: `Property showcase video: ${video.filename.replace(/-/g, " ")}`, // Remove dashes
                        type: 'fallback',
                        score: 50
                    },
                    smartCaptionVersions: null,
                    tags: ['#realestate', '#property', '#homes'],
                    title: video.filename.replace(/\.[^/.]+$/, "").replace(/-/g, " "), // Remove dashes
                    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                    audioMatch: null,
                    uploadDate: video.uploadDate,
                    filename: video.filename,
                    platform: video.platform || 'youtube',
                    status: video.status,
                    error: 'Failed to process video data'
                };
            }
        }));
        res.json({
            success: true,
            data: {
                videos: postQueueData,
                totalCount: postQueueData.length,
                integrations: {
                    smartCaptionsEnabled: !!openaiApiKey,
                    hashtagsFromTopPerformers: true,
                    audioMatchingActive: true,
                    dashRemovalApplied: true
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching enhanced post queue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch enhanced post queue',
            error: error.message
        });
    }
});
exports.default = router;
