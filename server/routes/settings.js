const express = require('express');
const auth = require('../middleware/auth');
const { getDB } = require('../config/database');
const router = express.Router();

// @route   GET /api/settings
// @desc    Get user settings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    res.json({
      postingSchedule: {
        enabled: true,
        postsPerDay: 3,
        preferredTimes: ['09:00', '14:00', '19:00'],
        timezone: 'America/Chicago',
      },
      platforms: {
        instagram: { connected: false, username: '' },
        tiktok: { connected: false, username: '' },
        youtube: { connected: false, username: '' },
      },
      notifications: {
        email: true,
        push: true,
        postSuccess: true,
        postFailure: true,
        lowContent: true,
      },
      content: {
        autoGenerateCaptions: true,
        useTrendingHashtags: true,
        includeLocation: true,
        watermark: false,
      },
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/settings
// @desc    Update user settings
// @access  Private
router.put('/', auth, async (req, res) => {
  try {
    // In a real app, you'd save these to the database
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: req.body
    });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/settings/api-keys
// @desc    Get user's API keys (masked)
// @access  Private
router.get('/api-keys', auth, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId; // Fixed: use userId instead of id

    // Get all API keys for the user
    const apiKeys = await new Promise((resolve, reject) => {
      db.all(
        'SELECT keyName, keyValue FROM api_keys WHERE userId = ? AND isActive = 1',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Create a map of configured keys
    const configuredKeys = {};
    apiKeys.forEach(key => {
      configuredKeys[key.keyName.toLowerCase()] = key.keyValue;
    });

    // Check which keys are configured
    const keys = [
      {
        name: 'OpenAI',
        configured: !!configuredKeys.openai,
        masked: configuredKeys.openai ? 
          `${configuredKeys.openai.substring(0, 3)}***${configuredKeys.openai.substring(configuredKeys.openai.length - 3)}` : 
          'Not configured'
      },
      {
        name: 'Instagram',
        configured: !!configuredKeys.instagram,
        masked: configuredKeys.instagram ? 
          `${configuredKeys.instagram.substring(0, 8)}***${configuredKeys.instagram.substring(configuredKeys.instagram.length - 8)}` : 
          'Not configured'
      }
    ];

    res.json({ keys });
  } catch (error) {
    console.error('API keys error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/settings/api-keys
// @desc    Add/update API key
// @access  Private
router.post('/api-keys', auth, async (req, res) => {
  try {
    const { name, key } = req.body;
    const userId = req.user.userId; // Fixed: use userId instead of id
    
    if (!name || !key) {
      return res.status(400).json({ error: 'Name and key are required' });
    }
    
    const db = getDB();
    
    // Insert or update the API key
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO api_keys (userId, keyName, keyValue, isActive, createdAt) 
         VALUES (?, ?, ?, 1, datetime('now'))`,
        [userId, name.toLowerCase(), key],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });
    
    res.json({
      success: true,
      message: 'API key saved successfully',
      keyName: name
    });
  } catch (error) {
    console.error('API key save error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/platforms/status
// @desc    Get platform connection status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId; // Fixed: use userId instead of id

    // Get social account connections
    const socialAccounts = await new Promise((resolve, reject) => {
      db.all(
        'SELECT platform, username, isActive FROM social_accounts WHERE userId = ? AND isActive = 1',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Create status object
    const status = {
      instagram: {
        connected: false,
        username: null,
        lastSync: null
      },
      tiktok: {
        connected: false,
        username: null,
        lastSync: null
      },
      youtube: {
        connected: false,
        username: null,
        lastSync: null
      }
    };

    // Update status based on connected accounts
    socialAccounts.forEach(account => {
      if (status[account.platform]) {
        status[account.platform].connected = true;
        status[account.platform].username = account.username;
      }
    });

    res.json(status);
  } catch (error) {
    console.error('Platform status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 