const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Instagram OAuth configuration
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:5001/api/oauth/instagram/callback';

// TikTok OAuth configuration
const TIKTOK_CLIENT_ID = process.env.TIKTOK_CLIENT_ID;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'http://localhost:5001/api/oauth/tiktok/callback';

// YouTube OAuth configuration
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5001/api/oauth/youtube/callback';

// @route   POST /api/oauth/instagram/authorize
// @desc    Get Instagram authorization URL
// @access  Private
router.post('/instagram/authorize', auth, async (req, res) => {
  try {
    const state = req.userId; // Use user ID as state for security
    const scope = 'user_profile,user_media';
    
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${INSTAGRAM_REDIRECT_URI}&scope=${scope}&response_type=code&state=${state}`;
    
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('Instagram OAuth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/oauth/tiktok/authorize
// @desc    Get TikTok authorization URL
// @access  Private
router.post('/tiktok/authorize', auth, async (req, res) => {
  try {
    const state = req.userId; // Use user ID as state for security
    const scope = 'user.info.basic,video.list,video.upload';
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${TIKTOK_CLIENT_ID}&scope=${scope}&response_type=code&redirect_uri=${TIKTOK_REDIRECT_URI}&state=${state}`;
    
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('TikTok OAuth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/oauth/youtube/authorize
// @desc    Get YouTube authorization URL
// @access  Private
router.post('/youtube/authorize', auth, async (req, res) => {
  try {
    const state = req.userId; // Use user ID as state for security
    const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${YOUTUBE_REDIRECT_URI}&scope=${scope}&response_type=code&state=${state}&access_type=offline`;
    
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('YouTube OAuth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/oauth/:platform/disconnect
// @desc    Disconnect social platform
// @access  Private
router.delete('/:platform/disconnect', auth, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.userId;
    
    // TODO: Remove tokens from database
    // This would typically update the user's social account tokens
    
    res.json({
      success: true,
      message: `${platform} disconnected successfully`
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/oauth/status
// @desc    Get OAuth connection status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // TODO: Check actual connection status from database
    const status = {
      instagram: {
        connected: false,
        username: ''
      },
      tiktok: {
        connected: false,
        username: ''
      },
      youtube: {
        connected: false,
        username: ''
      }
    };
    
    res.json(status);
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/oauth/:platform/test
// @desc    Test platform connection
// @access  Private
router.post('/:platform/test', auth, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.userId;
    
    // TODO: Test actual API connection
    // This would make a test API call to verify the connection
    
    res.json({
      success: true,
      message: `${platform} connection test successful`
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 