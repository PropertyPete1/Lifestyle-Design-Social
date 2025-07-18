import { Router, Request, Response } from 'express';
import { bestTimeToPostService } from '../services/bestTimeToPostService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/best-time-to-post/optimal-times
 * Get optimal posting times for all platforms
 */
router.get('/optimal-times', authenticateToken, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const optimalTimes = await bestTimeToPostService.getAllOptimalTimes(days);

    return res.json({
      success: true,
      data: optimalTimes,
      message: 'Optimal posting times retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting optimal posting times:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get optimal posting times',
    });
  }
});

/**
 * GET /api/best-time-to-post/optimal-times/:platform
 * Get optimal posting times for a specific platform
 */
router.get('/optimal-times/:platform', authenticateToken, async (req: Request, res: Response) => {
  try {
    const platform = req.params.platform as 'instagram' | 'tiktok' | 'youtube';
    const days = parseInt(req.query.days as string) || 30;

    if (!['instagram', 'tiktok', 'youtube'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform. Must be instagram, tiktok, or youtube',
      });
    }

    const optimalTimes = await bestTimeToPostService.getOptimalPostingTimes(platform, days);

    return res.json({
      success: true,
      data: {
        platform,
        optimal_times: optimalTimes,
        analysis_period_days: days,
      },
      message: `Optimal posting times for ${platform} retrieved successfully`,
    });
  } catch (error) {
    logger.error(`Error getting optimal posting times for ${req.params.platform}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get optimal posting times',
    });
  }
});

/**
 * POST /api/best-time-to-post/record-engagement
 * Record engagement data for a post
 */
router.post('/record-engagement', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { platform, post_id, posted_at, likes, comments, shares, views } = req.body;

    // Validate required fields
    if (
      !platform ||
      !post_id ||
      !posted_at ||
      likes === undefined ||
      comments === undefined ||
      shares === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: platform, post_id, posted_at, likes, comments, shares',
      });
    }

    // Validate platform
    if (!['instagram', 'tiktok', 'youtube'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform. Must be instagram, tiktok, or youtube',
      });
    }

    await bestTimeToPostService.recordEngagementData({
      platform,
      post_id,
      posted_at: new Date(posted_at),
      likes: parseInt(likes),
      comments: parseInt(comments),
      shares: parseInt(shares),
      views: views ? parseInt(views) : undefined,
    });

    return res.json({
      success: true,
      message: 'Engagement data recorded successfully',
    });
  } catch (error) {
    logger.error('Error recording engagement data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record engagement data',
    });
  }
});

/**
 * PUT /api/best-time-to-post/update-schedule
 * Update the dynamic posting schedule
 */
router.put('/update-schedule', authenticateToken, async (_req: Request, res: Response) => {
  try {
    await bestTimeToPostService.updateDynamicSchedule();

    return res.json({
      success: true,
      message: 'Dynamic posting schedule updated successfully',
    });
  } catch (error) {
    logger.error('Error updating dynamic schedule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update dynamic schedule',
    });
  }
});

/**
 * GET /api/best-time-to-post/current-schedule
 * Get the current dynamic posting schedule
 */
router.get('/current-schedule', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const currentSchedule = await bestTimeToPostService.getCurrentSchedule();

    if (!currentSchedule) {
      return res.status(404).json({
        success: false,
        error: 'No dynamic schedule found',
      });
    }

    return res.json({
      success: true,
      data: currentSchedule,
      message: 'Current dynamic schedule retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting current schedule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get current schedule',
    });
  }
});

/**
 * GET /api/best-time-to-post/analytics
 * Get engagement analytics summary
 */
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const allOptimalTimes = await bestTimeToPostService.getAllOptimalTimes(days);

    // Calculate analytics summary
    const analytics = {
      total_data_points: allOptimalTimes.data_points,
      analysis_period_days: days,
      last_updated: allOptimalTimes.last_updated,
      fallback_used: allOptimalTimes.fallback_used,
      last_engagement_update: allOptimalTimes.last_engagement_update,
      api_status: allOptimalTimes.api_status,
      platform_breakdown: {
        instagram: {
          optimal_times: allOptimalTimes.instagram,
          avg_confidence:
            allOptimalTimes.instagram.reduce((sum, time) => sum + time.confidence, 0) /
              allOptimalTimes.instagram.length || 0,
        },
        tiktok: {
          optimal_times: allOptimalTimes.tiktok,
          avg_confidence:
            allOptimalTimes.tiktok.reduce((sum, time) => sum + time.confidence, 0) /
              allOptimalTimes.tiktok.length || 0,
        },
        youtube: {
          optimal_times: allOptimalTimes.youtube,
          avg_confidence:
            allOptimalTimes.youtube.reduce((sum, time) => sum + time.confidence, 0) /
              allOptimalTimes.youtube.length || 0,
        },
      },
    };

    return res.json({
      success: true,
      data: analytics,
      message: 'Engagement analytics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting engagement analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get engagement analytics',
    });
  }
});

/**
 * GET /api/best-time-to-post/health
 * Get system health and fallback status
 */
router.get('/health', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const health = await bestTimeToPostService.getSystemHealth();

    return res.json({
      success: true,
      data: health,
      message: 'System health retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting system health:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get system health',
    });
  }
});

/**
 * POST /api/best-time-to-post/record-api-failure
 * Record API failure for health monitoring
 */
router.post('/record-api-failure', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { platform, error } = req.body;

    if (!platform || !['instagram', 'tiktok', 'youtube'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform. Must be instagram, tiktok, or youtube',
      });
    }

    await bestTimeToPostService.recordAPIFailure(platform, { message: error || 'Unknown error' });

    return res.json({
      success: true,
      message: 'API failure recorded successfully',
    });
  } catch (error) {
    logger.error('Error recording API failure:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record API failure',
    });
  }
});

export default router;
