import express, { Request, Response } from 'express';
import multer from 'multer';
import { VideoQueue } from '../../services/videoQueue';
import { VideoStatus } from '../../models/VideoStatus';
import { generateVideoFingerprint, findDuplicateVideo } from '../../lib/youtube/videoFingerprint';
import { connectToDatabase } from '../../database/connection';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Get settings from settings.json
function getSettings(): any {
  const settingsPath = path.resolve(__dirname, '../../../frontend/settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch (e) {
      console.error('Failed to read settings.json:', e);
    }
  }
  return {};
}

// GET /api/upload/dropbox-status
// Get Dropbox monitoring statistics
router.get('/dropbox-status', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    
    // Get real stats from VideoStatus
    const totalUploaded = await VideoStatus.countDocuments();
    const todayUploaded = await VideoStatus.countDocuments({
      uploadDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    // Get stats from Dropbox monitor
    const dropboxMonitor = await import('../../services/dropboxMonitor');
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
  } catch (error: any) {
    console.error('Dropbox status error:', error);
    res.status(500).json({ 
      error: 'Failed to get Dropbox status', 
      details: error.message 
    });
  }
});

// POST /api/upload/scan-dropbox
// Manually trigger Dropbox folder scan
router.post('/scan-dropbox', async (req: Request, res: Response) => {
  try {
    console.log('Manual Dropbox scan requested');
    
    // Trigger actual Dropbox scan
    const dropboxMonitor = await import('../../services/dropboxMonitor');
    const stats = await dropboxMonitor.triggerManualScan();
    
    res.json({
      success: true,
      message: 'Dropbox scan completed',
      stats
    });
  } catch (error: any) {
    console.error('Manual Dropbox scan error:', error);
    res.status(500).json({ 
      error: 'Failed to scan Dropbox', 
      details: error.message 
    });
  }
});

// POST /api/upload/url
// Upload video from URL with repost detection
router.post('/url', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();

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
    const videoFingerprint = generateVideoFingerprint(mockBuffer, filename);
    console.log(`Generated fingerprint: ${videoFingerprint.hash.substring(0, 12)}... (${videoFingerprint.size} bytes)`);

    // Get repost settings
    const settings = getSettings();
    const minDaysBetweenPosts = settings.minDaysBetweenPosts || 20;

    // Check for duplicates using VideoStatus model
    const existingVideo = await VideoStatus.findOne({
      'fingerprint.hash': videoFingerprint.hash
    }).sort({ lastPosted: -1 });

    if (existingVideo && existingVideo.lastPosted) {
      const daysSinceLastPost = Math.floor(
        (Date.now() - existingVideo.lastPosted.getTime()) / (1000 * 60 * 60 * 24)
      );

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
    const videoId = uuidv4();
    const timestamp = Date.now();
    const savedFilename = `${timestamp}_url_${videoFingerprint.hash.substring(0, 8)}_${filename}`;

    // Create VideoStatus record
    const videoStatus = new VideoStatus({
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
    const videoQueue = new VideoQueue({
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

  } catch (error: any) {
    console.error('URL upload error:', error);
    res.status(500).json({ 
      error: 'URL upload failed', 
      details: error.message || 'Unknown error' 
    });
  }
});

// POST /api/upload
// Bulk file upload with fingerprinting and de-dupe
router.post('/', upload.array('videos', 20), async (req: Request, res: Response) => {
  try {
    await connectToDatabase();

    const files = req.files as Express.Multer.File[];
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
      details: [] as any[]
    };

    // Get settings
    const settings = getSettings();
    const minDaysBetweenPosts = settings.minDaysBetweenPosts || 20;

    for (const file of files) {
      try {
        // Generate video fingerprint
        const fingerprint = generateVideoFingerprint(file.buffer, file.originalname);
        
        // Check for duplicates using VideoStatus model
        const existingVideo = await VideoStatus.findOne({
          'fingerprint.hash': fingerprint.hash
        }).sort({ lastPosted: -1 });

        if (existingVideo && existingVideo.lastPosted) {
          const daysSinceLastPost = Math.floor(
            (Date.now() - existingVideo.lastPosted.getTime()) / (1000 * 60 * 60 * 24)
          );

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
        const videoId = uuidv4();
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
        const videoStatus = new VideoStatus({
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
        const videoQueue = new VideoQueue({
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

      } catch (error: any) {
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

  } catch (error: any) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ 
      error: 'Bulk upload failed', 
      details: error.message 
    });
  }
});

// GET /api/upload/queue
// Get current video queue
router.get('/queue', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();

    const limit = parseInt(req.query.limit as string) || 50;
    const videos = await VideoQueue.find()
      .sort({ uploadedAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      videos,
      total: videos.length
    });

  } catch (error: any) {
    console.error('Queue fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch video queue', 
      details: error.message 
    });
  }
});

// GET /api/upload/status
// Get video upload status history
router.get('/status', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();

    const limit = parseInt(req.query.limit as string) || 50;
    const platform = req.query.platform as string;

    const query = platform ? { platform } : {};
    const statuses = await VideoStatus.find(query)
      .sort({ uploadDate: -1 })
      .limit(limit);

    res.json({
      success: true,
      statuses,
      total: statuses.length
    });

  } catch (error: any) {
    console.error('Status fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch video statuses', 
      details: error.message 
    });
  }
});

export default router; 