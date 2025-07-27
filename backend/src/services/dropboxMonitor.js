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
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanDropboxFolder = scanDropboxFolder;
exports.getMonitorStats = getMonitorStats;
exports.startDropboxMonitoring = startDropboxMonitoring;
exports.triggerManualScan = triggerManualScan;
const dropbox_1 = require("dropbox");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cron = __importStar(require("node-cron"));
const videoQueue_1 = require("./videoQueue");
const VideoStatus_1 = require("../models/VideoStatus");
const videoFingerprint_1 = require("../lib/youtube/videoFingerprint");
const repostMonitor_1 = require("./repostMonitor");
const localStorage_1 = require("./localStorage");
const getPeakPostTime_1 = require("../lib/youtube/getPeakPostTime");
const connection_1 = require("../database/connection");
const uuid_1 = require("uuid");
// Get settings from backend settings service instead of frontend settings.json
async function getSettings() {
    try {
        // Read from backend settings.json first for backward compatibility
        const backendSettingsPath = path.resolve(__dirname, '../../settings.json');
        if (fs.existsSync(backendSettingsPath)) {
            const backendSettings = JSON.parse(fs.readFileSync(backendSettingsPath, 'utf-8'));
            return backendSettings;
        }
        // Fallback to frontend settings if backend doesn't exist
        const frontendSettingsPath = path.resolve(__dirname, '../../../frontend/settings.json');
        if (fs.existsSync(frontendSettingsPath)) {
            return JSON.parse(fs.readFileSync(frontendSettingsPath, 'utf-8'));
        }
        return {};
    }
    catch (e) {
        console.error('Failed to read settings:', e);
        return {};
    }
}
// Initialize Dropbox client
async function getDropboxClient() {
    const settings = await getSettings();
    const apiKey = process.env.DROPBOX_API_KEY || settings.dropboxApiKey;
    if (!apiKey) {
        console.log('No Dropbox API key found - skipping Dropbox monitoring');
        return null;
    }
    return new dropbox_1.Dropbox({ accessToken: apiKey });
}
// Track processed files to avoid reprocessing
const processedFiles = new Set();
const DROPBOX_FOLDER = '/Lifestyle Social App Uploads/'; // Target folder to monitor
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
let monitorStats = {
    totalFilesFound: 0,
    newFilesProcessed: 0,
    duplicatesSkipped: 0,
    errors: 0,
    lastCheck: new Date()
};
/**
 * Process a single video file from Dropbox
 */
async function processDropboxVideo(dbx, fileEntry, settings) {
    try {
        const filename = fileEntry.name;
        console.log(`Processing Dropbox video: ${filename}`);
        // Download file from Dropbox
        const downloadResponse = await dbx.filesDownload({ path: fileEntry.path_lower });
        const buffer = Buffer.from(downloadResponse.result.fileBinary);
        // Generate video fingerprint for repost detection
        const videoFingerprint = (0, videoFingerprint_1.generateVideoFingerprint)(buffer, filename);
        console.log(`Generated fingerprint: ${videoFingerprint.hash.substring(0, 12)}... (${videoFingerprint.size} bytes)`);
        // Check for duplicates using VideoStatus model
        const repostSettings = (0, videoFingerprint_1.getRepostSettings)();
        const minDaysBetweenPosts = repostSettings.minDaysBeforeRepost;
        const existingVideo = await VideoStatus_1.VideoStatus.findOne({
            'fingerprint.hash': videoFingerprint.hash
        }).sort({ lastPosted: -1 });
        if (existingVideo && existingVideo.lastPosted) {
            const daysSinceLastPost = Math.floor((Date.now() - existingVideo.lastPosted.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLastPost < minDaysBetweenPosts) {
                console.log(`Skipping duplicate: ${filename} (last posted ${daysSinceLastPost} days ago)`);
                monitorStats.duplicatesSkipped++;
                return { success: false, reason: 'duplicate' };
            }
        }
        // Create shared link for storage
        let storageUrl = '';
        try {
            const shared = await dbx.sharingCreateSharedLinkWithSettings({ path: fileEntry.path_lower });
            storageUrl = shared.result.url.replace('?dl=0', '?raw=1');
        }
        catch (linkError) {
            console.log('Failed to create shared link, falling back to local storage');
            storageUrl = await (0, localStorage_1.saveToLocal)(buffer, filename);
        }
        // Save file locally if needed
        const videoId = (0, uuid_1.v4)();
        const timestamp = Date.now();
        const localFilename = `${timestamp}_dropbox_${videoFingerprint.hash.substring(0, 8)}_${filename}`;
        const localFilePath = path.join(process.cwd(), 'uploads', localFilename);
        // Ensure uploads directory exists
        const uploadsDir = path.dirname(localFilePath);
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        // Save buffer to local file
        fs.writeFileSync(localFilePath, buffer);
        // Create VideoStatus record
        const videoStatus = new VideoStatus_1.VideoStatus({
            videoId,
            platform: 'instagram', // Default to Instagram for Dropbox uploads
            fingerprint: videoFingerprint,
            filename,
            filePath: localFilePath,
            uploadDate: new Date(),
            captionGenerated: false,
            posted: false,
            status: 'pending'
        });
        await videoStatus.save();
        // Get optimal posting time
        const { recommendedTime } = (0, getPeakPostTime_1.getPeakPostTime)();
        // Also add to video queue for backward compatibility
        const videoQueueData = {
            type: 'real_estate',
            dropboxUrl: storageUrl,
            filename,
            status: 'pending',
            scheduledTime: recommendedTime,
            videoHash: videoFingerprint.hash,
            videoSize: videoFingerprint.size,
            videoDuration: videoFingerprint.duration,
            platform: 'instagram',
            filePath: localFilePath
        };
        const videoQueueEntry = new videoQueue_1.VideoQueue(videoQueueData);
        await videoQueueEntry.save();
        // Trigger repost monitor check for new upload (Phase 2)
        repostMonitor_1.repostMonitor.onVideoUploaded().catch(error => {
            console.warn('Repost monitor hook failed:', error);
        });
        console.log(`✅ Successfully processed: ${filename}`);
        monitorStats.newFilesProcessed++;
        return { success: true };
    }
    catch (error) {
        console.error(`Failed to process ${fileEntry.name}:`, error.message);
        monitorStats.errors++;
        return { success: false, reason: 'error' };
    }
}
/**
 * Scan Dropbox folder for new videos
 */
async function scanDropboxFolder() {
    const dbx = await getDropboxClient();
    if (!dbx) {
        return monitorStats;
    }
    try {
        console.log(`🔍 Scanning Dropbox folder: ${DROPBOX_FOLDER}`);
        await (0, connection_1.connectToDatabase)();
        // List files in the target folder
        const response = await dbx.filesListFolder({
            path: DROPBOX_FOLDER,
            recursive: false
        });
        const videoFiles = response.result.entries.filter((entry) => entry['.tag'] === 'file' &&
            VIDEO_EXTENSIONS.some(ext => entry.name.toLowerCase().endsWith(ext)));
        monitorStats.totalFilesFound = videoFiles.length;
        monitorStats.lastCheck = new Date();
        console.log(`Found ${videoFiles.length} video files in Dropbox`);
        // Process new files
        const settings = await getSettings();
        for (const fileEntry of videoFiles) {
            // Only process file entries (not folders)
            if (fileEntry['.tag'] !== 'file')
                continue;
            const fileKey = `${fileEntry.path_lower}_${fileEntry.content_hash}`;
            if (!processedFiles.has(fileKey)) {
                const result = await processDropboxVideo(dbx, fileEntry, settings);
                if (result.success || result.reason === 'duplicate') {
                    processedFiles.add(fileKey);
                }
                // Add small delay between files to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        console.log(`📊 Dropbox scan complete: ${monitorStats.newFilesProcessed} new, ${monitorStats.duplicatesSkipped} duplicates, ${monitorStats.errors} errors`);
    }
    catch (error) {
        console.error('Dropbox folder scan failed:', error.message);
        monitorStats.errors++;
    }
    return monitorStats;
}
/**
 * Get current monitoring statistics
 */
function getMonitorStats() {
    return { ...monitorStats };
}
/**
 * Start continuous Dropbox monitoring
 */
function startDropboxMonitoring() {
    console.log('🚀 Starting Dropbox folder monitoring...');
    // Initial scan
    scanDropboxFolder();
    // Schedule scans every 10 minutes
    cron.schedule('*/10 * * * *', () => {
        console.log('⏰ Scheduled Dropbox folder scan...');
        scanDropboxFolder();
    });
    console.log('✅ Dropbox monitoring scheduled (every 10 minutes)');
}
/**
 * Manually trigger a folder scan
 */
async function triggerManualScan() {
    console.log('🔄 Manual Dropbox folder scan triggered...');
    return await scanDropboxFolder();
}
