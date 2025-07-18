import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { youtubeAPI, YouTubeVideoUpload } from '../integrations/youtube/youtubeAPI';
import User from '../models/User';
import { Post } from '../models/Post';
import { connectToDatabase } from '../config/database';

const router = Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/videos/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'youtube-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit for YouTube
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported formats: MP4, MOV, AVI, WMV, FLV, WEBM'));
    }
  },
});

// @route   GET /api/youtube/auth
// @desc    Get YouTube authorization URL
// @access  Private
router.get('/auth', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authUrl = youtubeAPI.generateAuthUrl();

    return res.json({
      success: true,
      authUrl,
      message: 'Visit this URL to authorize YouTube access',
    });
  } catch (error) {
    logger.error('Error generating YouTube auth URL:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL',
    });
  }
});

// @route   POST /api/youtube/callback
// @desc    Handle YouTube OAuth callback
// @access  Private
router.post('/callback', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const { code } = req.body;
    const userId = req.user!.id;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      });
    }

    // Exchange code for tokens
    const tokens = await youtubeAPI.getAccessToken(code);

    // Save tokens to user record
    await User.findByIdAndUpdate(userId, {
      'socialMediaTokens.youtube': {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        connectedAt: new Date(),
      },
      'platforms.youtube.connected': true,
      'platforms.youtube.connectedAt': new Date(),
    });

    logger.info(`YouTube connected successfully for user ${userId}`);

    return res.json({
      success: true,
      message: 'YouTube connected successfully',
      expiresIn: tokens.expires_in,
    });
  } catch (error) {
    logger.error('YouTube callback error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to connect YouTube account',
    });
  }
});

// @route   POST /api/youtube/upload
// @desc    Upload video to YouTube
// @access  Private
router.post(
  '/upload',
  authenticateToken,
  upload.single('video'),
  async (req: Request, res: Response) => {
    try {
      await connectToDatabase();
      const userId = req.user!.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Video file is required',
        });
      }

      const { title, description, tags, privacyStatus = 'public', categoryId } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          error: 'Title and description are required',
        });
      }

      // Get user's YouTube tokens
      const user = await User.findById(userId);
      if (!user?.socialMediaTokens?.youtube?.accessToken) {
        return res.status(401).json({
          success: false,
          error: 'YouTube account not connected. Please connect your YouTube account first.',
        });
      }

      // Set access token for API
      youtubeAPI.setAccessToken(
        user.socialMediaTokens.youtube.accessToken,
        user.socialMediaTokens.youtube.refreshToken
      );

      // Prepare upload options
      const uploadOptions: YouTubeVideoUpload = {
        title,
        description,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        privacyStatus: privacyStatus as 'public' | 'private' | 'unlisted',
        categoryId: categoryId || '22', // Real Estate could be '2' (Autos & Vehicles) or '22' (People & Blogs)
      };

      // Upload to YouTube
      const result = await youtubeAPI.uploadVideo(req.file.path, uploadOptions);

      if (result.success) {
        // Save post record to database
        const newPost = new Post({
          userId,
          platform: 'youtube',
          content: description,
          scheduledTime: new Date(),
          postedTime: new Date(),
          status: 'posted',
          platformPostId: result.videoId,
          videoUrl: result.videoUrl,
          metadata: {
            title,
            tags: uploadOptions.tags,
            privacyStatus,
            categoryId,
          },
        });

        await newPost.save();

        logger.info(`YouTube video uploaded successfully: ${result.videoUrl}`);

        return res.json({
          success: true,
          data: {
            videoId: result.videoId,
            videoUrl: result.videoUrl,
            title,
            uploadTime: result.uploadTime,
          },
          message: 'Video uploaded to YouTube successfully',
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error || 'Upload failed',
        });
      }
    } catch (error) {
      logger.error('YouTube upload error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload video to YouTube',
      });
    }
  }
);

// @route   POST /api/youtube/shorts
// @desc    Upload YouTube Shorts video
// @access  Private
router.post(
  '/shorts',
  authenticateToken,
  upload.single('video'),
  async (req: Request, res: Response) => {
    try {
      await connectToDatabase();
      const userId = req.user!.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Video file is required',
        });
      }

      const { title, description, tags } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          error: 'Title and description are required',
        });
      }

      // Get user's YouTube tokens
      const user = await User.findById(userId);
      if (!user?.socialMediaTokens?.youtube?.accessToken) {
        return res.status(401).json({
          success: false,
          error: 'YouTube account not connected',
        });
      }

      youtubeAPI.setAccessToken(
        user.socialMediaTokens.youtube.accessToken,
        user.socialMediaTokens.youtube.refreshToken
      );

      const uploadOptions: YouTubeVideoUpload = {
        title,
        description,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        privacyStatus: 'public',
        categoryId: '22',
      };

      // Upload as YouTube Shorts
      const result = await youtubeAPI.uploadShorts(req.file.path, uploadOptions);

      if (result.success) {
        const newPost = new Post({
          userId,
          platform: 'youtube',
          content: description,
          scheduledTime: new Date(),
          postedTime: new Date(),
          status: 'posted',
          platformPostId: result.videoId,
          videoUrl: result.videoUrl,
          metadata: {
            title,
            tags: uploadOptions.tags,
            type: 'shorts',
          },
        });

        await newPost.save();

        return res.json({
          success: true,
          data: {
            videoId: result.videoId,
            videoUrl: result.videoUrl,
            title,
            type: 'shorts',
          },
          message: 'YouTube Shorts uploaded successfully',
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error || 'Shorts upload failed',
        });
      }
    } catch (error) {
      logger.error('YouTube Shorts upload error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload YouTube Shorts',
      });
    }
  }
);

// @route   GET /api/youtube/analytics
// @desc    Get YouTube channel analytics
// @access  Private
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;

    const user = await User.findById(userId);
    if (!user?.socialMediaTokens?.youtube?.accessToken) {
      return res.status(401).json({
        success: false,
        error: 'YouTube account not connected',
      });
    }

    youtubeAPI.setAccessToken(
      user.socialMediaTokens.youtube.accessToken,
      user.socialMediaTokens.youtube.refreshToken
    );

    const analytics = await youtubeAPI.getChannelAnalytics();

    return res.json({
      success: true,
      data: analytics,
      message: 'YouTube analytics retrieved successfully',
    });
  } catch (error) {
    logger.error('YouTube analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get YouTube analytics',
    });
  }
});

// @route   GET /api/youtube/status
// @desc    Check YouTube connection status
// @access  Private
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;

    const user = await User.findById(userId);
    const youtubeData = user?.socialMediaTokens?.youtube;

    if (!youtubeData?.accessToken) {
      return res.json({
        success: true,
        data: {
          connected: false,
          message: 'YouTube account not connected',
        },
      });
    }

    youtubeAPI.setAccessToken(youtubeData.accessToken, youtubeData.refreshToken);

    // Test if token is still valid
    const isValid = await youtubeAPI.validateToken();

    if (isValid) {
      return res.json({
        success: true,
        data: {
          connected: true,
          connectedAt: youtubeData.connectedAt,
          message: 'YouTube account connected and active',
        },
      });
    } else {
      // Try to refresh token
      try {
        const newTokens = await youtubeAPI.refreshAccessToken();

        // Update user with new tokens
        await User.findByIdAndUpdate(userId, {
          'socialMediaTokens.youtube.accessToken': newTokens.access_token,
          'socialMediaTokens.youtube.expiresIn': newTokens.expires_in,
        });

        return res.json({
          success: true,
          data: {
            connected: true,
            connectedAt: youtubeData.connectedAt,
            message: 'YouTube connection refreshed successfully',
          },
        });
      } catch (refreshError) {
        logger.error('Token refresh failed:', refreshError);

        return res.json({
          success: true,
          data: {
            connected: false,
            message: 'YouTube connection expired. Please reconnect.',
          },
        });
      }
    }
  } catch (error) {
    logger.error('YouTube status check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check YouTube status',
    });
  }
});

// @route   DELETE /api/youtube/disconnect
// @desc    Disconnect YouTube account
// @access  Private
router.delete('/disconnect', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;

    await User.findByIdAndUpdate(userId, {
      $unset: {
        'socialMediaTokens.youtube': 1,
        'platforms.youtube': 1,
      },
    });

    logger.info(`YouTube disconnected for user ${userId}`);

    return res.json({
      success: true,
      message: 'YouTube account disconnected successfully',
    });
  } catch (error) {
    logger.error('YouTube disconnect error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to disconnect YouTube account',
    });
  }
});

export default router;
