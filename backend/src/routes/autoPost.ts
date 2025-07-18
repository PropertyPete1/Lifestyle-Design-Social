import { Router } from 'express';
import { logger } from '../utils/logger';
import { cartoonService } from '../services/cartoonService';
import { cameraRollService } from '../services/cameraRollService';
import User from '../models/User';

const router = Router();

// @route   POST /api/autopost/create-cartoon
// @desc    Create a new AI cartoon
// @access  Private
router.post('/create-cartoon', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { prompt, style } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required for cartoon generation',
      });
    }

    const cartoon = await cartoonService.createCompleteCartoon(userId, prompt, style);

    res.json({
      success: true,
      data: {
        cartoon,
        message: 'Cartoon generation started successfully',
      },
    });
  } catch (error) {
    logger.error('Error creating cartoon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cartoon',
    });
  }
});

// @route   GET /api/autopost/cartoons
// @desc    Get user's cartoons
// @access  Private
router.get('/cartoons', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const cartoons = await cartoonService.listUserCartoons(userId);

    res.json({
      success: true,
      data: {
        cartoons,
        count: cartoons.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching cartoons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cartoons',
    });
  }
});

// @route   GET /api/autopost/cartoon-stats
// @desc    Get cartoon statistics for user
// @access  Private
router.get('/cartoon-stats', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const stats = await cartoonService.getCartoonStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching cartoon stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cartoon statistics',
    });
  }
});

// @route   DELETE /api/autopost/cartoon/:cartoonId
// @desc    Delete a cartoon
// @access  Private
router.delete('/cartoon/:cartoonId', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { cartoonId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!cartoonId) {
      return res.status(400).json({
        success: false,
        error: 'Cartoon ID is required',
      });
    }

    const deleted = await cartoonService.deleteCartoon(cartoonId, userId);

    if (deleted) {
      res.json({
        success: true,
        message: 'Cartoon deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cartoon not found or could not be deleted',
      });
    }
  } catch (error) {
    logger.error('Error deleting cartoon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete cartoon',
    });
  }
});

// @route   GET /api/autopost/camera-roll
// @desc    Get user's camera roll videos
// @access  Private
router.get('/camera-roll', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const videos = await cameraRollService.getCameraRollVideos(userId);

    res.json({
      success: true,
      data: {
        videos,
        count: videos.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching camera roll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch camera roll videos',
    });
  }
});

// @route   POST /api/autopost/create-sample-cartoon
// @desc    Create a sample cartoon for testing
// @access  Private
router.post('/create-sample-cartoon', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Create a sample cartoon response
    const sampleCartoon = {
      id: `sample_${Date.now()}`,
      prompt: 'Sample real estate cartoon',
      style: 'modern',
      status: 'completed',
      generatedAt: new Date().toISOString(),
      filename: `cartoon_${Date.now()}.mp4`,
      url: `/uploads/cartoons/sample_cartoon_${Date.now()}.mp4`,
    };

    logger.info(`Sample cartoon created for user ${userId}`);

    res.json({
      success: true,
      data: {
        cartoon: sampleCartoon,
        message: 'Sample cartoon created successfully',
      },
    });
  } catch (error) {
    logger.error('Error creating sample cartoon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sample cartoon',
    });
  }
});

// @route   GET /api/autopost/settings
// @desc    Get auto-posting settings for user
// @access  Private
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get user settings from database
    const user = await User.findById(userId).select('autoPostSettings');

    const defaultSettings = {
      enabled: false,
      platforms: ['instagram'],
      schedule: {
        frequency: 'daily',
        time: '09:00',
        timezone: 'UTC',
      },
      content: {
        useAI: true,
        generateCaptions: true,
        useHashtags: true,
        maxHashtags: 10,
      },
      quality: {
        videoQuality: 'high',
        compression: 'balanced',
      },
    };

    const settings = user?.autoPostSettings || defaultSettings;

    res.json({
      success: true,
      data: { settings },
    });
  } catch (error) {
    logger.error('Error fetching auto-post settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
    });
  }
});

// @route   PUT /api/autopost/settings
// @desc    Update auto-posting settings for user
// @access  Private
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        success: false,
        error: 'Settings data is required',
      });
    }

    // Update user settings in database
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          autoPostSettings: settings,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    logger.info(`Auto-post settings updated for user ${userId}`);

    res.json({
      success: true,
      data: {
        settings,
        message: 'Settings updated successfully',
      },
    });
  } catch (error) {
    logger.error('Error updating auto-post settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
    });
  }
});

export default router;
