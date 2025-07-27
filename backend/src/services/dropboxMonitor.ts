import { Dropbox } from 'dropbox';
import * as fs from 'fs';
import * as path from 'path';
import * as cron from 'node-cron';
import { VideoQueue } from './videoQueue';
import { VideoStatus } from '../models/VideoStatus';
import { generateVideoFingerprint, findDuplicateVideo, getRepostSettings } from '../lib/youtube/videoFingerprint';
import { repostMonitor } from './repostMonitor';
import { uploadToDropbox } from './dropbox';
import { saveToLocal, getLocalFilePath } from './localStorage';
import { getPeakPostTime } from '../lib/youtube/getPeakPostTime';
import { connectToDatabase } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

// Get settings from backend settings service instead of frontend settings.json
async function getSettings(): Promise<any> {
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
  } catch (e) {
    console.error('Failed to read settings:', e);
    return {};
  }
}

// Initialize Dropbox client
async function getDropboxClient(): Promise<Dropbox | null> {
  const settings = await getSettings();
  const apiKey = process.env.DROPBOX_API_KEY || settings.dropboxApiKey;
  
  if (!apiKey) {
    console.log('No Dropbox API key found - skipping Dropbox monitoring');
    return null;
  }
  
  return new Dropbox({ accessToken: apiKey });
}

// Track processed files to avoid reprocessing
const processedFiles = new Set<string>();
const DROPBOX_FOLDER = '/Lifestyle Social App Uploads/'; // Target folder to monitor
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];

export interface DropboxMonitorStats {
  totalFilesFound: number;
  newFilesProcessed: number;
  duplicatesSkipped: number;
  errors: number;
  lastCheck: Date;
}

let monitorStats: DropboxMonitorStats = {
  totalFilesFound: 0,
  newFilesProcessed: 0,
  duplicatesSkipped: 0,
  errors: 0,
  lastCheck: new Date()
};

/**
 * Process a single video file from Dropbox
 */
async function processDropboxVideo(
  dbx: Dropbox, 
  fileEntry: any, 
  settings: any
): Promise<{ success: boolean; reason?: string }> {
  try {
    const filename = fileEntry.name;
    console.log(`Processing Dropbox video: ${filename}`);

    // Download file from Dropbox
    const downloadResponse = await dbx.filesDownload({ path: fileEntry.path_lower });
    const buffer = Buffer.from((downloadResponse.result as any).fileBinary);

    // Generate video fingerprint for repost detection
    const videoFingerprint = generateVideoFingerprint(buffer, filename);
    console.log(`Generated fingerprint: ${videoFingerprint.hash.substring(0, 12)}... (${videoFingerprint.size} bytes)`);

    // Check for duplicates using VideoStatus model
    const repostSettings = getRepostSettings();
  const minDaysBetweenPosts = repostSettings.minDaysBeforeRepost;
    
    const existingVideo = await VideoStatus.findOne({
      'fingerprint.hash': videoFingerprint.hash
    }).sort({ lastPosted: -1 });

    if (existingVideo && existingVideo.lastPosted) {
      const daysSinceLastPost = Math.floor(
        (Date.now() - existingVideo.lastPosted.getTime()) / (1000 * 60 * 60 * 24)
      );

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
    } catch (linkError) {
      console.log('Failed to create shared link, falling back to local storage');
      storageUrl = await saveToLocal(buffer, filename);
    }

    // Save file locally if needed
    const videoId = uuidv4();
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
    const videoStatus = new VideoStatus({
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
    const { recommendedTime } = getPeakPostTime();

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

    const videoQueueEntry = new VideoQueue(videoQueueData);
    await videoQueueEntry.save();

    // Trigger repost monitor check for new upload (Phase 2)
    repostMonitor.onVideoUploaded().catch(error => {
      console.warn('Repost monitor hook failed:', error);
    });

    console.log(`✅ Successfully processed: ${filename}`);
    monitorStats.newFilesProcessed++;
    return { success: true };

  } catch (error: any) {
    console.error(`Failed to process ${fileEntry.name}:`, error.message);
    monitorStats.errors++;
    return { success: false, reason: 'error' };
  }
}

/**
 * Scan Dropbox folder for new videos
 */
export async function scanDropboxFolder(): Promise<DropboxMonitorStats> {
  const dbx = await getDropboxClient();
  if (!dbx) {
    return monitorStats;
  }

  try {
    console.log(`🔍 Scanning Dropbox folder: ${DROPBOX_FOLDER}`);
    await connectToDatabase();

    // List files in the target folder
    const response = await dbx.filesListFolder({ 
      path: DROPBOX_FOLDER,
      recursive: false 
    });

    const videoFiles = response.result.entries.filter((entry: any) => 
      entry['.tag'] === 'file' && 
      VIDEO_EXTENSIONS.some(ext => entry.name.toLowerCase().endsWith(ext))
    );

    monitorStats.totalFilesFound = videoFiles.length;
    monitorStats.lastCheck = new Date();

    console.log(`Found ${videoFiles.length} video files in Dropbox`);

    // Process new files
    const settings = await getSettings();
    for (const fileEntry of videoFiles) {
      // Only process file entries (not folders)
      if (fileEntry['.tag'] !== 'file') continue;
      
      const fileKey = `${fileEntry.path_lower}_${(fileEntry as any).content_hash}`;
      
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

  } catch (error: any) {
    console.error('Dropbox folder scan failed:', error.message);
    monitorStats.errors++;
  }

  return monitorStats;
}

/**
 * Get current monitoring statistics
 */
export function getMonitorStats(): DropboxMonitorStats {
  return { ...monitorStats };
}

/**
 * Start continuous Dropbox monitoring
 */
export function startDropboxMonitoring(): void {
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
export async function triggerManualScan(): Promise<DropboxMonitorStats> {
  console.log('🔄 Manual Dropbox folder scan triggered...');
  return await scanDropboxFolder();
} 