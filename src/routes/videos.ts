import { Router } from 'express';
import { getTodayScheduledVideos } from '../lib/scheduler/videoQueue';
import { tryPostingWithRetries } from '../lib/posting/retryLogic';
import { logSimplePostSuccess, logSimplePostFailure } from '../lib/posting/logger';
import { generateThumbnail } from '../videos/thumbnailGenerator';
import fs from 'fs';
import path from 'path';

const router = Router();

router.post('/today', async (req, res) => {
  try {
    const videos = await getTodayScheduledVideos();
    let postedCount = 0;

    for (const video of videos) {
      const success = await tryPostingWithRetries(
        video.id, 
        video.caption, 
        video.fileUrl
      );
      
      if (success) {
        logSimplePostSuccess(video.id);
        postedCount++;
      } else {
        logSimplePostFailure(video.id, 'All retry attempts failed');
      }
    }

    res.status(200).json({ posted: postedCount, total: videos.length });
  } catch (error) {
    console.error('Daily posting failed:', error);
    res.status(500).json({ error: 'Daily posting failed' });
  }
});

// Add thumbnail generation route
router.post('/thumbnail', async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Missing filename' });
    }

    const videoPath = path.join(process.cwd(), 'public', 'uploads', filename);
    const thumbPath = path.join(process.cwd(), 'public', 'thumbnails', `${filename}.jpg`);

    // Ensure thumbnails directory exists
    const thumbDir = path.dirname(thumbPath);
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }

    await generateThumbnail(videoPath, thumbPath);
    res.status(200).json({ success: true, thumbnail: `/thumbnails/${filename}.jpg` });
  } catch (err) {
    console.error('Thumbnail generation failed:', err);
    res.status(500).json({ success: false, error: 'Thumbnail generation failed' });
  }
});

// Add thumbnail limit check route
router.get('/checkLimit', (req, res) => {
  try {
    const { getThumbnailStats, canGenerateThumbnail } = require('../utils/fileLimitGuard');
    
    const stats = getThumbnailStats();
    const permission = canGenerateThumbnail();
    
    res.json({
      stats: {
        count: stats.count,
        sizeMB: stats.sizeMB,
        isCountLimitReached: stats.isCountLimitReached,
        isSizeLimitReached: stats.isSizeLimitReached
      },
      canGenerate: permission.allowed,
      reason: permission.reason
    });
  } catch (error) {
    console.error('Error checking thumbnail limits:', error);
    res.status(500).json({ error: 'Failed to check thumbnail limits' });
  }
});

export default router; 