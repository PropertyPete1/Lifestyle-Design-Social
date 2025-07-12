const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Video = require('../models/Video');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
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
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB default
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
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const {
      title,
      description,
      category,
      tags,
      location,
      price,
      propertyType
    } = req.body;

    // Create video record
    const videoData = {
      userId: req.user.userId,
      title: title || req.file.originalname,
      description: description || '',
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      duration: null, // Will be updated by video processing
      resolution: null,
      hasAudio: true,
      category: category || 'real-estate',
      propertyType: propertyType || 'house',
      location: location || '',
      price: price ? parseFloat(price) : null,
      tags: tags ? JSON.stringify(tags.split(',').map(tag => tag.trim())) : '[]',
      aiScore: 0
    };

    const video = await Video.create(videoData);

    // Check if we should create a cartoon video (every other real estate video)
    if (category === 'real-estate' || !category) {
      try {
        const cartoonService = require('../services/cartoonService');
        const userVideoCount = await Video.countByUser(req.user.userId);
        
        // Create cartoon every other video upload
        if (userVideoCount % 2 === 0) {
          console.log(`🎨 Creating cartoon for user ${req.user.userId} (video #${userVideoCount})`);
          
          // Create cartoon in background
          setTimeout(async () => {
            try {
              const cartoon = await cartoonService.createSampleCartoon();
              console.log(`✅ Cartoon created: ${cartoon.fileName}`);
            } catch (error) {
              console.error('❌ Background cartoon creation failed:', error);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('❌ Cartoon creation check failed:', error);
        // Don't fail the video upload if cartoon creation fails
      }
    }

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        title: video.title,
        fileName: video.fileName
      }
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/videos
// @desc    Get user's videos
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const videos = await Video.findByUser(req.user.userId);
    const stats = await Video.getVideoStats(req.user.userId);
    
    res.json({
      videos,
      stats
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/videos/:id
// @desc    Get video by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video || video.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/videos/:id/stream
// @desc    Stream video file
// @access  Private
router.get('/:id/stream', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video || video.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const filePath = video.filePath;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
      const chunksize = (end-start) + 1;
      const file = fs.createReadStream(filePath, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Video stream error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/videos/:id/stream-public
// @desc    Stream video file with token authentication
// @access  Public (but requires valid token)
router.get('/:id/stream-public', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const video = await Video.findById(req.params.id);
    
    if (!video || video.userId !== decoded.userId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const filePath = video.filePath;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
      const chunksize = (end-start)+1;
      const file = fs.createReadStream(filePath, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Stream video error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/videos/:id
// @desc    Update video
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video || video.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const {
      title,
      description,
      category,
      tags,
      location,
      price,
      propertyType
    } = req.body;

    // Update fields
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (tags) updateData.tags = JSON.stringify(tags.split(',').map(tag => tag.trim()));
    if (location) updateData.location = location;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (propertyType) updateData.propertyType = propertyType;

    // Update in database
    const db = require('../config/database').getDB();
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), req.params.id];

    await new Promise((resolve, reject) => {
      db.run(`UPDATE videos SET ${setClause} WHERE id = ?`, values, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    res.json({
      message: 'Video updated successfully'
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete video
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video || video.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(video.filePath)) {
      fs.unlinkSync(video.filePath);
    }

    // Delete from database
    const db = require('../config/database').getDB();
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM videos WHERE id = ?', [req.params.id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/videos/:id/thumbnail
// @desc    Get video thumbnail
// @access  Private
router.get('/:id/thumbnail', auth, async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!video.thumbnail) {
      return res.status(404).json({ error: 'Thumbnail not found' });
    }

    res.sendFile(path.resolve(video.thumbnail));
  } catch (error) {
    console.error('Get thumbnail error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Video processing function
async function processVideo(videoId) {
  try {
    const video = await Video.findById(videoId);
    if (!video) return;

    // Update processing progress
    video.processingProgress = 10;
    await video.save();

    // Get video metadata using FFmpeg
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegPath = require('ffmpeg-static');
    ffmpeg.setFfmpegPath(ffmpegPath);

    ffmpeg.ffprobe(video.filePath, async (err, metadata) => {
      if (err) {
        console.error('FFprobe error:', err);
        video.status = 'error';
        await video.save();
        return;
      }

      // Update video metadata
      video.duration = metadata.format.duration;
      video.format = metadata.format.format_name;
      
      if (metadata.streams && metadata.streams.length > 0) {
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (videoStream) {
          video.dimensions = {
            width: videoStream.width,
            height: videoStream.height
          };
        }
      }

      video.processingProgress = 50;
      await video.save();

      // Generate thumbnail
      const thumbnailPath = video.filePath.replace(path.extname(video.filePath), '_thumb.jpg');
      
      ffmpeg(video.filePath)
        .screenshots({
          timestamps: ['50%'],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '320x240'
        })
        .on('end', async () => {
          video.thumbnail = thumbnailPath;
          video.processingProgress = 100;
          video.status = 'ready';
          await video.save();
          console.log(`✅ Video ${videoId} processing completed`);
        })
        .on('error', async (err) => {
          console.error('Thumbnail generation error:', err);
          video.processingProgress = 100;
          video.status = 'ready';
          await video.save();
        });
    });
  } catch (error) {
    console.error('Video processing error:', error);
    const video = await Video.findById(videoId);
    if (video) {
      video.status = 'error';
      await video.save();
    }
  }
}

module.exports = router; 