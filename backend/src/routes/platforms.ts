import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { User } from '../models/User';
import { connectToDatabase } from '../config/database';

const router = Router();

interface PlatformStatus {
  platform: string;
  status: 'active' | 'inactive' | 'error';
  connected: boolean;
  lastPost?: string;
  postsToday?: number;
  followerCount?: number;
  nextPostTime?: string;
  health: 'healthy' | 'warning' | 'error';
  message?: string;
}

// @route   GET /api/platforms/status
// @desc    Get status of all connected social media platforms
// @access  Private
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;
    
    // Get user to check connected platforms
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mock platform statuses with realistic data
    const platforms: PlatformStatus[] = [
      {
        platform: 'Instagram',
        status: 'active',
        connected: true,
        lastPost: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        postsToday: 2,
        followerCount: 1250,
        nextPostTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
        health: 'healthy',
        message: 'All systems operational'
      },
      {
        platform: 'TikTok',
        status: 'active',
        connected: true,
        lastPost: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        postsToday: 1,
        followerCount: 892,
        nextPostTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
        health: 'healthy',
        message: 'Ready to post'
      },
      {
        platform: 'YouTube',
        status: 'inactive',
        connected: false,
        lastPost: undefined,
        postsToday: 0,
        followerCount: 0,
        nextPostTime: undefined,
        health: 'warning',
        message: 'Not connected - Click to set up'
      }
    ];

    return res.json(platforms);
  } catch (error) {
    logger.error('Get platforms status error:', error);
    return res.status(500).json({ error: 'Failed to get platform status' });
  }
});

// @route   POST /api/platforms/connect/:platform
// @desc    Connect a social media platform
// @access  Private
router.post('/connect/:platform', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;
    const platform = req.params.platform.toLowerCase();
    
    const validPlatforms = ['instagram', 'tiktok', 'youtube', 'facebook'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ 
        error: 'Invalid platform. Supported platforms: instagram, tiktok, youtube, facebook' 
      });
    }

    // For now, return success with instructions for real integration
    const connectionInstructions = {
      instagram: {
        step1: 'Go to Facebook Developer Console',
        step2: 'Create Instagram Basic Display App',
        step3: 'Get your Instagram API credentials',
        step4: 'Add redirect URL: http://localhost:3000/auth/instagram/callback',
        authUrl: 'https://developers.facebook.com/docs/instagram-basic-display-api'
      },
      youtube: {
        step1: 'Go to Google Cloud Console',
        step2: 'Enable YouTube Data API v3',
        step3: 'Create OAuth 2.0 credentials',
        step4: 'Add redirect URL: http://localhost:3000/auth/youtube/callback',
        authUrl: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com'
      },
      tiktok: {
        step1: 'Apply for TikTok for Developers',
        step2: 'Wait for approval (can take several days)',
        step3: 'Set up OAuth integration',
        step4: 'Add redirect URL: http://localhost:3000/auth/tiktok/callback',
        authUrl: 'https://developers.tiktok.com/'
      }
    };

    return res.json({
      success: true,
      message: `${platform} connection initiated`,
      platform: platform,
      status: 'pending_setup',
      instructions: connectionInstructions[platform as keyof typeof connectionInstructions] || {
        step1: 'Please check platform documentation',
        authUrl: '#'
      }
    });
  } catch (error) {
    logger.error('Connect platform error:', error);
    return res.status(500).json({ error: 'Failed to connect platform' });
  }
});

// @route   DELETE /api/platforms/disconnect/:platform
// @desc    Disconnect a social media platform
// @access  Private
router.delete('/disconnect/:platform', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const platform = req.params.platform.toLowerCase();
    
    // For demo purposes, always return success
    return res.json({
      success: true,
      message: `${platform} disconnected successfully`,
      platform: platform,
      status: 'disconnected'
    });
  } catch (error) {
    logger.error('Disconnect platform error:', error);
    return res.status(500).json({ error: 'Failed to disconnect platform' });
  }
});

// @route   GET /api/platforms/supported
// @desc    Get list of supported platforms
// @access  Public
router.get('/supported', async (_req: Request, res: Response) => {
  try {
    const supportedPlatforms = [
      {
        id: 'instagram',
        name: 'Instagram',
        description: 'Share photos and videos to Instagram',
        features: ['Posts', 'Stories', 'Reels'],
        maxVideoLength: 60,
        maxFileSize: '100MB',
        supportedFormats: ['mp4', 'mov'],
        apiDocumentation: 'https://developers.facebook.com/docs/instagram-basic-display-api'
      },
      {
        id: 'tiktok',
        name: 'TikTok',
        description: 'Upload short-form videos to TikTok',
        features: ['Videos', 'Effects'],
        maxVideoLength: 180,
        maxFileSize: '500MB',
        supportedFormats: ['mp4', 'mov'],
        apiDocumentation: 'https://developers.tiktok.com/'
      },
      {
        id: 'youtube',
        name: 'YouTube',
        description: 'Upload videos to YouTube',
        features: ['Videos', 'Shorts', 'Thumbnails'],
        maxVideoLength: 900, // 15 minutes for unverified accounts
        maxFileSize: '2GB',
        supportedFormats: ['mp4', 'mov', 'avi'],
        apiDocumentation: 'https://developers.google.com/youtube/v3'
      }
    ];

    return res.json({
      success: true,
      platforms: supportedPlatforms,
      totalPlatforms: supportedPlatforms.length
    });
  } catch (error) {
    logger.error('Get supported platforms error:', error);
    return res.status(500).json({ error: 'Failed to get supported platforms' });
  }
});

// @route   GET /api/platforms/analytics/:platform
// @desc    Get analytics for a specific platform
// @access  Private
router.get('/analytics/:platform', authenticateToken, async (req: Request, res: Response) => {
  try {
    const platform = req.params.platform.toLowerCase();
    const { days = 30 } = req.query;
    
    // Mock analytics data for the specified platform
    const analytics = {
      platform: platform,
      timeframe: `${days} days`,
      posts: Math.floor(Math.random() * 20) + 5,
      reach: Math.floor(Math.random() * 10000) + 1000,
      engagement: Math.floor(Math.random() * 1000) + 100,
      followers: Math.floor(Math.random() * 2000) + 500,
      growth: Math.floor(Math.random() * 50) + 10,
      topPost: {
        id: 'post_123',
        caption: 'Beautiful real estate property showcase',
        likes: Math.floor(Math.random() * 500) + 50,
        comments: Math.floor(Math.random() * 50) + 5,
        shares: Math.floor(Math.random() * 25) + 2
      }
    };

    return res.json({
      success: true,
      data: analytics,
      message: `Analytics for ${platform} retrieved successfully`
    });
  } catch (error) {
    logger.error('Get platform analytics error:', error);
    return res.status(500).json({ error: 'Failed to get platform analytics' });
  }
});

export default router; 