const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const SocialAccount = require('../models/SocialAccount');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    // Check if user already exists
    let user = await User.findByEmail(email);
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    user = await User.create({ name, email, password });
    // Optionally, add company and other fields if your schema supports it

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: company || null,
        settings: {},
        socialAccounts: {}
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company || null,
        settings: {},
        socialAccounts: {}
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Exclude password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, company, settings } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (company) user.company = company;
    if (settings) user.settings = { ...user.settings, ...settings };

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        settings: user.settings,
        socialAccounts: user.socialAccounts
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/connect-twitter
// @desc    Connect Twitter account
// @access  Private
router.post('/connect-twitter', auth, async (req, res) => {
  try {
    const { accessToken, accessSecret, username } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update Twitter connection
    user.socialAccounts.twitter = {
      connected: true,
      username,
      accessToken,
      accessSecret
    };

    await user.save();

    res.json({
      message: 'Twitter account connected successfully',
      socialAccounts: user.socialAccounts
    });
  } catch (error) {
    console.error('Connect Twitter error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/connect-instagram
// @desc    Connect Instagram account
// @access  Private
router.post('/connect-instagram', auth, async (req, res) => {
  try {
    const { username, password } = req.body; // username is city, password is accessToken
    const userId = req.user.userId;
    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Upsert the Instagram token for this user and city
    await SocialAccount.upsert({
      userId,
      platform: 'instagram',
      city: username,
      accessToken: password,
      username: null
    });
    res.json({ message: 'Instagram account connected successfully' });
  } catch (error) {
    console.error('Connect Instagram error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/auth/disconnect/:platform
// @desc    Disconnect social media account
// @access  Private
router.delete('/disconnect/:platform', auth, async (req, res) => {
  try {
    const { platform } = req.params;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (platform === 'twitter') {
      user.socialAccounts.twitter = {
        connected: false,
        username: null,
        accessToken: null,
        accessSecret: null
      };
    } else if (platform === 'instagram') {
      user.socialAccounts.instagram = {
        connected: false,
        username: null,
        accessToken: null
      };
    } else {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    await user.save();

    res.json({
      message: `${platform} account disconnected successfully`,
      socialAccounts: user.socialAccounts
    });
  } catch (error) {
    console.error('Disconnect account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 