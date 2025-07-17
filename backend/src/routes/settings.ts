import express from 'express';
import { logger } from '../utils/logger';
import { User } from '../models/User';
import { connectToDatabase } from '../config/database';

const router = express.Router();

// GET /api/settings - Get user settings
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
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: {
        autoPostingEnabled: user.autoPostingEnabled || false,
        postingTimes: user.postingTimes || [],
        timezone: user.timezone || 'UTC',
        testMode: user.testMode || false,
        instagramConnected: !!user.instagramAccessToken
      }
    });
  } catch (error) {
    logger.error('Error getting settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get settings'
    });
  }
});

// PUT /api/settings - Update user settings
router.put('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    await connectToDatabase();
    
    const { 
      autoPostingEnabled, 
      postingTimes, 
      timezone, 
      testMode 
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        autoPostingEnabled,
        postingTimes,
        timezone,
        testMode,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: {
        autoPostingEnabled: updatedUser.autoPostingEnabled,
        postingTimes: updatedUser.postingTimes,
        timezone: updatedUser.timezone,
        testMode: updatedUser.testMode
      },
      message: 'Settings updated successfully'
    });
  } catch (error) {
    logger.error('Error updating settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

// POST /api/settings/instagram - Connect Instagram account
router.post('/instagram', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { accessToken, username, userId: instagramUserId } = req.body;

    if (!accessToken || !username) {
      return res.status(400).json({
        success: false,
        error: 'Access token and username are required'
      });
    }

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        instagramAccessToken: accessToken,
        instagramUserId: instagramUserId,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      message: 'Instagram account connected successfully',
      data: {
        instagramUserId: updatedUser.instagramUserId,
        instagramConnected: true
      }
    });
  } catch (error) {
    logger.error('Error connecting Instagram:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to connect Instagram account'
    });
  }
});

// DELETE /api/settings/instagram - Disconnect Instagram account
router.delete('/instagram', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          instagramAccessToken: 1,
          instagramUsername: 1,
          instagramUserId: 1
        },
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      message: 'Instagram account disconnected successfully'
    });
  } catch (error) {
    logger.error('Error disconnecting Instagram:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to disconnect Instagram account'
    });
  }
});

export default router; 