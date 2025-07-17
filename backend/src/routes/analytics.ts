import express from 'express';
import { logger } from '../utils/logger';
import { analyticsService } from '../services/analyticsService';

const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const analytics = await analyticsService.getUserAnalytics(userId);

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting analytics overview:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get analytics overview'
    });
  }
});

// GET /api/analytics/best-times
router.get('/best-times', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const days = parseInt(req.query.days as string) || 30;
    const result = await analyticsService.getBestPostingTimes(userId, days);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting best posting times:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get best posting times'
    });
  }
});

// GET /api/analytics/posts/:postId
router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const analytics = await analyticsService.getPostAnalytics(postId);

    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting post analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get post analytics'
    });
  }
});

// GET /api/analytics/videos/:videoId
router.get('/videos/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const analytics = await analyticsService.getVideoAnalytics(videoId);

    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting video analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get video analytics'
    });
  }
});

// POST /api/analytics/engagement
router.post('/engagement', async (req, res) => {
  try {
    const { postId, metrics } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!postId || !metrics) {
      return res.status(400).json({
        success: false,
        error: 'Post ID and metrics are required'
      });
    }

    await analyticsService.recordPostEngagement(postId, metrics);

    return res.json({
      success: true,
      message: 'Engagement metrics recorded successfully'
    });
  } catch (error) {
    logger.error('Error recording engagement metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record engagement metrics'
    });
  }
});

export default router; 