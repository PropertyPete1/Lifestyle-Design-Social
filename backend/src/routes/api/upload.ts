import express, { Request, Response } from 'express';
import multer from 'multer';
import { VideoQueue } from '../../services/videoQueue';
import { generateVideoFingerprint, findDuplicateVideo } from '../../lib/youtube/videoFingerprint';
import { connectToDatabase } from '../../database/connection';
import * as fs from 'fs';
import * as path from 'path';

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
router.get('/dropbox-status', (req: Request, res: Response) => {
  try {
    // Mock stats for testing
    const stats = {
      totalFilesFound: 5,
      newFilesProcessed: 2,
      duplicatesSkipped: 1,
      errors: 0,
      lastCheck: new Date()
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
    
    // Mock scan results for testing
    const stats = {
      totalFilesFound: 5,
      newFilesProcessed: 1,
      duplicatesSkipped: 0,
      errors: 0,
      lastCheck: new Date()
    };
    
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

    const { url, type } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid video URL required' });
    }

    if (!type || !['real_estate', 'cartoon'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be real_estate or cartoon' });
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

    console.log(`Processing URL upload: ${url} (${type})`);

    // For testing, simulate download
    const filename = url.split('/').pop() || `video-${Date.now()}.mp4`;
    const mockBuffer = Buffer.from('mock video data for testing');

    // Generate video fingerprint for repost detection
    const videoFingerprint = generateVideoFingerprint(mockBuffer, filename);
    console.log(`Generated fingerprint: ${videoFingerprint.hash.substring(0, 12)}... (${videoFingerprint.size} bytes)`);

    // Get repost settings
    const settings = getSettings();
    const minDaysBeforeRepost = settings.minDaysBeforeRepost || 20;

    // Check for duplicate videos using fingerprinting
    const duplicateCheck = await findDuplicateVideo(videoFingerprint, VideoQueue, minDaysBeforeRepost);
    
    if (duplicateCheck.isDuplicate) {
      return res.status(409).json({
        error: 'Duplicate video detected',
        message: `This video was already posted ${duplicateCheck.daysSinceLastPost} days ago. Minimum repost interval is ${minDaysBeforeRepost} days.`,
        lastPosted: duplicateCheck.lastPosted,
        originalVideo: {
          filename: duplicateCheck.originalVideo.filename,
          postedAt: duplicateCheck.originalVideo.lastPostedAt,
          daysSinceLastPost: duplicateCheck.daysSinceLastPost
        },
        minDaysBeforeRepost
      });
    }

    // For testing, simulate successful upload
    res.json({
      success: true,
      message: 'Video URL upload test successful',
      videoId: 'test-' + Date.now(),
      filename,
      storageUrl: url,
      storageType: 'test',
      type,
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

export default router; 