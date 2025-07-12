import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { VideoModel } from '../models/Video';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const videoModel = new VideoModel(pool);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/videos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '100') * 1024 * 1024 // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mov|avi|wmv|flv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// @route   POST /api/videos/upload
// @desc    Upload a new video
// @access  Private
router.post('/upload', authenticateToken, upload.single('video'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No video file uploaded' });
      return;
    }

    const userId = (req as any).userId;
    const {
      title,
      description,
      category = 'real-estate',
      propertyType,
      location,
      price,
      tags,
      preferredCaption,
      preferredHashtags,
      preferredMusic,
      coolOffDays,
    } = req.body;

    // Create video record
    const videoData = {
      userId,
      title: title || req.file.originalname.replace(/\.[^/.]+$/, ""),
      description: description || '',
      filename: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      category: category as 'real-estate' | 'cartoon',
      propertyType: propertyType || 'house',
      location: location || '',
      price: price ? parseFloat(price) : undefined,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      preferredCaption,
      preferredHashtags: preferredHashtags ? preferredHashtags.split(',').map((tag: string) => tag.trim()) : [],
      preferredMusic,
      coolOffDays: coolOffDays ? parseInt(coolOffDays) : undefined,
    };

    const video = await videoModel.create(videoData);

    logger.info(`Video uploaded: ${video.title} by user ${userId}`);

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
  } catch (error) {
    logger.error('Video upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/videos
// @desc    Get user's videos
// @access  Private
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { category, isActive, limit, offset } = req.query;

    const videos = await videoModel.findByUser(userId, {
      category: category as 'real-estate' | 'cartoon',
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    const stats = await videoModel.getVideoStats(userId);

    res.json({
      videos,
      stats,
    });
  } catch (error) {
    logger.error('Get videos error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/videos/:id
// @desc    Get video by ID
// @access  Private
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
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
    
    // Check if user owns the video
    if (video.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    res.json(video);
    return;
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
    return;
  }
});

// @route   GET /api/videos/:id/stream
// @desc    Stream video file
// @access  Private
  router.get('/:id/stream', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
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
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Video file not found' });
      return;
    }

    const stat = fs.statSync(filePath);
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
      const file = fs.createReadStream(filePath, { start, end: fileSize - 1 });
      const head = {
        'Content-Range': `bytes ${start}-${fileSize - 1}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    }
  } catch (error) {
    logger.error('Video stream error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/videos/:id
// @desc    Update video
// @access  Private
  router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
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

    const {
      title,
      description,
      preferredCaption,
      preferredHashtags,
      preferredMusic,
      coolOffDays,
      isActive,
    } = req.body;

    const updatedVideo = await videoModel.update(videoId, {
      title,
      description,
      preferredCaption,
      preferredHashtags: preferredHashtags ? preferredHashtags.split(',').map((tag: string) => tag.trim()) : undefined,
      preferredMusic,
      coolOffDays: coolOffDays ? parseInt(coolOffDays) : undefined,
      isActive,
    });

    if (!updatedVideo) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    logger.info(`Video updated: ${updatedVideo.title} by user ${userId}`);

    res.json({
      message: 'Video updated successfully',
      video: updatedVideo,
    });
  } catch (error) {
    logger.error('Update video error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete video
// @access  Private
  router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
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

    // Delete file from filesystem
    if (fs.existsSync(video.filePath)) {
      fs.unlinkSync(video.filePath);
    }

    // Delete thumbnail if exists
    if (video.thumbnailPath && fs.existsSync(video.thumbnailPath)) {
      fs.unlinkSync(video.thumbnailPath);
    }

    // Delete from database
    const deleted = await videoModel.delete(videoId);

    if (!deleted) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    logger.info(`Video deleted: ${video.title} by user ${userId}`);

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    logger.error('Delete video error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/videos/next/:category
// @desc    Get next video for posting
// @access  Private
router.get('/next/:category', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const category = req.params.category as 'real-estate' | 'cartoon';

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
  } catch (error) {
    logger.error('Get next video error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/videos/:id/mark-posted
// @desc    Mark video as posted
// @access  Private
  router.post('/:id/mark-posted', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
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

    logger.info(`Video marked as posted: ${updatedVideo.title} by user ${userId}`);

    res.json({
      message: 'Video marked as posted successfully',
      video: {
        id: updatedVideo.id,
        title: updatedVideo.title,
        postCount: updatedVideo.postCount,
        lastPostedAt: updatedVideo.lastPostedAt,
      }
    });
  } catch (error) {
    logger.error('Mark video posted error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/videos/stats
// @desc    Get video statistics
// @access  Private
router.get('/stats', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const stats = await videoModel.getVideoStats(userId);

    res.json({ stats });
  } catch (error) {
    logger.error('Get video stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 