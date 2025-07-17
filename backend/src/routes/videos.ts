import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { Video } from '../models/Video';
import { connectToDatabase } from '../config/database';

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/videos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// GET /api/videos - Get all videos for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    await connectToDatabase();
    
    const videos = await Video.find({ userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    logger.error('Error getting videos:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get videos'
    });
  }
});

// POST /api/videos/upload - Upload a new video
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

    await connectToDatabase();

    const { title, description, category = 'real-estate' } = req.body;

    const video = new Video({
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
  } catch (error) {
    logger.error('Error uploading video:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload video'
    });
  }
});

// GET /api/videos/:id - Get specific video
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

    await connectToDatabase();
    
    const video = await Video.findOne({ _id: id, userId });
    
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
  } catch (error) {
    logger.error('Error getting video:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get video'
    });
  }
});

// PUT /api/videos/:id - Update video
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

    await connectToDatabase();
    
    const { title, description, category } = req.body;
    
    const video = await Video.findOneAndUpdate(
      { _id: id, userId },
      { title, description, category, updatedAt: new Date() },
      { new: true }
    );
    
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
  } catch (error) {
    logger.error('Error updating video:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update video'
    });
  }
});

// DELETE /api/videos/:id - Delete video
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

         await connectToDatabase();
     
     const video = await Video.findOne({ _id: id, userId });
     
     if (!video) {
       return res.status(404).json({
         success: false,
         error: 'Video not found'
       });
     }

     // Delete the actual file first
     if (video.filePath && fs.existsSync(video.filePath)) {
       fs.unlinkSync(video.filePath);
     }

     // Delete from database
     await Video.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting video:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete video'
    });
  }
});

export default router; 