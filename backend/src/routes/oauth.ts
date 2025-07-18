import express from 'express';
import { logger } from '../utils/logger';
import User from '../models/User';
import { connectToDatabase } from '../config/database';

const router = express.Router();

// GET /api/oauth/instagram - Start Instagram OAuth flow
router.get('/instagram', async (_req, res) => {
  try {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri =
      process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3001/api/oauth/instagram/callback';

    if (!clientId) {
      return res.status(500).json({
        success: false,
        error: 'Instagram OAuth not configured',
      });
    }

    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code`;

    return res.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    logger.error('Instagram OAuth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start Instagram OAuth flow',
    });
  }
});

// GET /api/oauth/instagram/callback - Handle Instagram OAuth callback
router.get('/instagram/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    const userId = req.user?.id;

    if (error) {
      return res.status(400).json({
        success: false,
        error: `Instagram OAuth error: ${error}`,
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'No authorization code received',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Exchange code for access token
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    // const _redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3001/api/oauth/instagram/callback';

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        error: 'Instagram OAuth credentials not configured',
      });
    }

    // In a real implementation, you would make API calls to Instagram
    // For now, we'll create a mock response
    const mockAccessToken = `mock_token_${Date.now()}`;
    const mockInstagramUserId = `mock_user_${Date.now()}`;

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        instagramAccessToken: mockAccessToken,
        instagramUserId: mockInstagramUserId,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      message: 'Instagram account connected successfully',
      data: {
        instagramUserId: mockInstagramUserId,
        connected: true,
      },
    });
  } catch (error) {
    logger.error('Instagram OAuth callback error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete Instagram OAuth',
    });
  }
});

// DELETE /api/oauth/instagram - Disconnect Instagram account
router.delete('/instagram', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          instagramAccessToken: 1,
          instagramUserId: 1,
          instagramRefreshToken: 1,
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      message: 'Instagram account disconnected successfully',
    });
  } catch (error) {
    logger.error('Instagram disconnect error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to disconnect Instagram account',
    });
  }
});

export default router;
