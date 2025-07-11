import express from 'express';
import { logger } from '../utils/logger';
import { UserModel } from '../models/User';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const userModel = new UserModel(pool);

// Instagram OAuth Routes
router.get('/instagram/auth', authenticateToken, (req, res) => {
  const clientId = process.env['INSTAGRAM_APP_ID'];
  const redirectUri = process.env['INSTAGRAM_REDIRECT_URI'] || 'http://localhost:3000/oauth/instagram/callback';
  const scope = 'user_profile,user_media';
  
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
  
  res.json({ authUrl });
});

router.get('/instagram/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state as string;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing authorization code or user ID' });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env['INSTAGRAM_APP_ID'] || '',
        client_secret: process.env['INSTAGRAM_APP_SECRET'] || '',
        grant_type: 'authorization_code',
        redirect_uri: process.env['INSTAGRAM_REDIRECT_URI'] || 'http://localhost:3000/oauth/instagram/callback',
        code: code as string,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      logger.error('Instagram OAuth error:', tokenData.error);
      return res.status(400).json({ error: 'Failed to get Instagram access token' });
    }

    // Store token in database
    await userModel.updateSocialTokens(userId, {
      instagramAccessToken: tokenData.access_token,
      instagramUserId: tokenData.user_id,
    });

    logger.info(`Instagram OAuth successful for user ${userId}`);
    res.json({ success: true, message: 'Instagram connected successfully' });
  } catch (error) {
    logger.error('Instagram OAuth callback error:', error);
    res.status(500).json({ error: 'Instagram authentication failed' });
  }
});

// TikTok OAuth Routes
router.get('/tiktok/auth', authenticateToken, (req, res) => {
  const clientKey = process.env['TIKTOK_CLIENT_KEY'];
  const redirectUri = process.env['TIKTOK_REDIRECT_URI'] || 'http://localhost:3000/oauth/tiktok/callback';
  const scope = 'user.info.basic,video.list';
  
  const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&state=${req.user?.id}`;
  
  res.json({ authUrl });
});

router.get('/tiktok/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state as string;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing authorization code or user ID' });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env['TIKTOK_CLIENT_KEY'] || '',
        client_secret: process.env['TIKTOK_CLIENT_SECRET'] || '',
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: process.env['TIKTOK_REDIRECT_URI'] || 'http://localhost:3000/oauth/tiktok/callback',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      logger.error('TikTok OAuth error:', tokenData.error);
      return res.status(400).json({ error: 'Failed to get TikTok access token' });
    }

    // Store token in database
    await userModel.updateSocialTokens(userId, {
      tiktokAccessToken: tokenData.access_token,
      tiktokUserId: tokenData.open_id,
    });

    logger.info(`TikTok OAuth successful for user ${userId}`);
    res.json({ success: true, message: 'TikTok connected successfully' });
  } catch (error) {
    logger.error('TikTok OAuth callback error:', error);
    res.status(500).json({ error: 'TikTok authentication failed' });
  }
});

// YouTube OAuth Routes
router.get('/youtube/auth', authenticateToken, (req, res) => {
  const clientId = process.env['YOUTUBE_CLIENT_ID'];
  const redirectUri = process.env['YOUTUBE_REDIRECT_URI'] || 'http://localhost:3000/oauth/youtube/callback';
  const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${req.user?.id}&access_type=offline`;
  
  res.json({ authUrl });
});

router.get('/youtube/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state as string;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing authorization code or user ID' });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env['YOUTUBE_CLIENT_ID'] || '',
        client_secret: process.env['YOUTUBE_CLIENT_SECRET'] || '',
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: process.env['YOUTUBE_REDIRECT_URI'] || 'http://localhost:3000/oauth/youtube/callback',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      logger.error('YouTube OAuth error:', tokenData.error);
      return res.status(400).json({ error: 'Failed to get YouTube access token' });
    }

    // Get channel information
    const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${tokenData.access_token}`);
    const channelData = await channelResponse.json();

    // Store token in database
    await userModel.updateSocialTokens(userId, {
      youtubeAccessToken: tokenData.access_token,
      youtubeRefreshToken: tokenData.refresh_token,
      youtubeChannelId: channelData.items?.[0]?.id,
    });

    logger.info(`YouTube OAuth successful for user ${userId}`);
    res.json({ success: true, message: 'YouTube connected successfully' });
  } catch (error) {
    logger.error('YouTube OAuth callback error:', error);
    res.status(500).json({ error: 'YouTube authentication failed' });
  }
});

// Disconnect social accounts
router.post('/disconnect/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updateData: any = {};
    
    switch (platform) {
      case 'instagram':
        updateData.instagramAccessToken = null;
        updateData.instagramUserId = null;
        break;
      case 'tiktok':
        updateData.tiktokAccessToken = null;
        updateData.tiktokUserId = null;
        break;
      case 'youtube':
        updateData.youtubeAccessToken = null;
        updateData.youtubeRefreshToken = null;
        updateData.youtubeChannelId = null;
        break;
      default:
        return res.status(400).json({ error: 'Invalid platform' });
    }

    await userModel.updateSocialTokens(userId, updateData);
    
    logger.info(`Disconnected ${platform} for user ${userId}`);
    res.json({ success: true, message: `${platform} disconnected successfully` });
  } catch (error) {
    logger.error('Disconnect social account error:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

// Get connected social accounts
router.get('/connected', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const connectedAccounts = {
      instagram: !!user.instagramAccessToken,
      tiktok: !!user.tiktokAccessToken,
      youtube: !!user.youtubeAccessToken,
    };

    res.json({ connectedAccounts });
  } catch (error) {
    logger.error('Get connected accounts error:', error);
    res.status(500).json({ error: 'Failed to get connected accounts' });
  }
});

// Refresh tokens
router.post('/refresh/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let newToken: string;

    switch (platform) {
      case 'instagram':
        // Instagram tokens are long-lived, no refresh needed
        return res.json({ success: true, message: 'Instagram tokens are long-lived' });
      
      case 'tiktok':
        // TikTok token refresh would go here
        return res.json({ success: true, message: 'TikTok token refresh not implemented yet' });
      
      case 'youtube':
        if (!user.youtubeRefreshToken) {
          return res.status(400).json({ error: 'No refresh token available' });
        }

        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env['YOUTUBE_CLIENT_ID'] || '',
            client_secret: process.env['YOUTUBE_CLIENT_SECRET'] || '',
            refresh_token: user.youtubeRefreshToken,
            grant_type: 'refresh_token',
          }),
        });

        const tokenData = await response.json();
        
        if (tokenData.error) {
          return res.status(400).json({ error: 'Failed to refresh YouTube token' });
        }

        await userModel.updateSocialTokens(userId, {
          youtubeAccessToken: tokenData.access_token,
        });

        newToken = tokenData.access_token;
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid platform' });
    }

    logger.info(`Refreshed ${platform} token for user ${userId}`);
    res.json({ success: true, message: `${platform} token refreshed successfully` });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

export default router; 