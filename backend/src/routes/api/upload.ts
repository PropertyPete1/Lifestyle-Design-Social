import express, { Request, Response } from 'express';
import multer from 'multer';
import { uploadToDropbox } from '../../services/dropbox';
import { saveToLocal, getLocalFilePath } from '../../services/localStorage';
import { VideoQueue } from '../../services/videoQueue';
import { matchVideoContent } from '../../lib/youtube/matchVideoContent';
import { prepareSmartCaption } from '../../lib/youtube/prepareSmartCaption';
import { connectToDatabase } from '../../database/connection';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit (increased from 100MB)
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

// Get OpenAI API key from settings
function getOpenAIKey(): string {
  // Try environment variable first
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // Try settings.json
  const settingsPath = path.resolve(__dirname, '../../../frontend/settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      if (settings.openaiApiKey) {
        return settings.openaiApiKey;
      }
    } catch (e) {
      console.error('Failed to read OpenAI API key from settings.json:', e);
    }
  }

  return '';
}

// POST /api/upload
// Upload video with repost detection and smart caption generation
router.post('/', (req: Request, res: Response) => {
  upload.single('video')(req, res, async (err) => {
    if (err) {
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          details: 'Video file must be smaller than 500MB',
          maxSize: '500MB'
        });
      }
      if (err.message === 'Only video files are allowed') {
        return res.status(400).json({
          error: 'Invalid file type',
          details: 'Only video files (.mp4, .mov, .avi, etc.) are allowed'
        });
      }
      return res.status(400).json({
        error: 'Upload error',
        details: err.message || 'Unknown upload error'
      });
    }

    try {
      // Ensure database connection
      await connectToDatabase();

    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { type } = req.body;
    if (!type || !['real_estate', 'cartoon'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be real_estate or cartoon' });
    }

    const filename = req.file.originalname;
    console.log(`Processing upload: ${filename} (${type})`);

    // Check for repost detection using video content analysis FIRST (only for real_estate videos)
    let repostInfo = null;
    let smartCaptions = null;

    if (type === 'real_estate') {
      console.log('🔍 Analyzing video content for repost detection...');
      const openaiKey = getOpenAIKey();
      
      // Use video buffer for content-based matching
      const matchResult = await matchVideoContent(req.file.buffer, filename);
      
      if (matchResult.isMatch && matchResult.originalVideo) {
        console.log(`🎯 REPOST DETECTED! Original: "${matchResult.originalVideo.title}" (${matchResult.confidence}% confidence)`);
        
        if (openaiKey) {
          // Generate smart captions
          console.log('Generating smart captions with GPT...');
          smartCaptions = await prepareSmartCaption(matchResult.originalVideo, openaiKey);
          
          repostInfo = {
            isRepost: true,
            confidence: matchResult.confidence,
            originalVideo: matchResult.originalVideo,
            smartCaptions
          };
        } else {
          console.log('⚠️ No OpenAI API key found - skipping smart caption generation');
          repostInfo = {
            isRepost: true,
            confidence: matchResult.confidence,
            originalVideo: matchResult.originalVideo
          };
        }
      } else {
        console.log(`✨ No repost detected - this appears to be new content (best match: ${matchResult.confidence}%)`);
        repostInfo = { 
          isRepost: false, 
          confidence: matchResult.confidence 
        };
      }
    }

    // Upload to storage (try Dropbox first, fallback to local)
    let storageUrl = '';
    let storageType = '';
    
    try {
      console.log('Uploading to Dropbox...');
      storageUrl = await uploadToDropbox(req.file.buffer, filename);
      storageType = 'dropbox';
      console.log('✅ Dropbox upload successful');
    } catch (dropboxError: any) {
      console.log('⚠️ Dropbox upload failed, trying local storage...', dropboxError.message);
      try {
        storageUrl = await saveToLocal(req.file.buffer, filename);
        storageType = 'local';
        console.log('✅ Local storage successful');
      } catch (localError: any) {
        console.log('❌ Local storage also failed:', localError.message);
        storageUrl = 'storage-failed';
        storageType = 'failed';
      }
    }

    // Add to video queue
    const videoQueueEntry = new VideoQueue({
      type,
      dropboxUrl: storageUrl,
      filename,
      status: storageType === 'failed' ? 'failed' : 'pending'
    });

    await videoQueueEntry.save();

    // Response with upload success and repost detection results
    const response: any = {
      success: true,
      message: storageType === 'failed' ? 
        'Video analyzed successfully (storage failed)' : 
        `Video uploaded successfully (${storageType} storage)`,
      videoId: videoQueueEntry._id,
      filename,
      storageUrl: storageType === 'failed' ? null : storageUrl,
      storageType,
      type,
      storageStatus: storageType === 'failed' ? 'failed' : 'success'
    };

    if (repostInfo) {
      response.repostDetection = repostInfo;
      
      if (repostInfo.isRepost && smartCaptions) {
        response.recommendedCaption = {
          versionA: smartCaptions.versionA,
          versionB: smartCaptions.versionB,
          versionC: smartCaptions.versionC,
          suggestion: `🎯 This video appears to be a repost! We've generated ${smartCaptions.versionA.score >= 80 ? 'high-scoring' : 'optimized'} captions for better performance.`
        };
      }
    }

    res.json(response);

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Handle specific errors
      if (error.message.includes('Dropbox')) {
        return res.status(500).json({ 
          error: 'Dropbox upload failed', 
          details: error.message 
        });
      }
      
      if (error.message.includes('OpenAI') || error.message.includes('GPT')) {
        return res.status(500).json({ 
          error: 'Smart caption generation failed', 
          details: error.message 
        });
      }

      res.status(500).json({ 
        error: 'Upload failed', 
        details: error.message || 'Unknown error' 
      });
    }
  });
});

// GET /api/upload/queue
// Get current video queue
router.get('/queue', async (req: Request, res: Response) => {
  try {
    // Ensure database connection
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

// GET /api/upload/file/:filename
// Serve local video files
router.get('/file/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    if (!filename || filename.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = getLocalFilePath(filename);
    
    // Check if file exists
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Serve the video file
    res.sendFile(filePath);

  } catch (error: any) {
    console.error('File serve error:', error);
    res.status(500).json({ 
      error: 'Failed to serve file', 
      details: error.message 
    });
  }
});

export default router; 