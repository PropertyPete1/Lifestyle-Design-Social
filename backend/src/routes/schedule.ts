import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
// import { schedulerService } from '../services/schedulerService';
import { logger } from '../utils/logger';

const router = Router();
// Use the imported schedulerService instance

// @route   GET /api/schedule/optimal-times
// @desc    Get optimal posting times
// @access  Private
router.get('/optimal-times', authenticateToken, async (_req: Request, res: Response) => {
  try {
    // const _userId = req.user!.userId;

    // Mock optimal times based on engagement patterns
    const optimalTimes = [
      { time: '09:00', platform: 'instagram', score: 8.5 },
      { time: '13:00', platform: 'instagram', score: 7.2 },
      { time: '18:00', platform: 'instagram', score: 9.1 },
      { time: '11:00', platform: 'tiktok', score: 8.8 },
      { time: '15:00', platform: 'tiktok', score: 7.5 },
      { time: '20:00', platform: 'tiktok', score: 8.9 },
    ];

    return res.json({
      optimalTimes,
      bestDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      recommendedFrequency: 'daily',
      timezone: 'America/Chicago',
    });
  } catch (error) {
    logger.error('Get optimal times error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/schedule/status
// @desc    Get schedule status
// @access  Private
router.get('/status', authenticateToken, async (_req: Request, res: Response) => {
  try {
    // const _userId = req.user!.userId;

    // Mock schedule status
    const nextPostTime = new Date();
    nextPostTime.setHours(nextPostTime.getHours() + 2);

    return res.json({
      isActive: true,
      nextPostTime: nextPostTime.toISOString(),
      queuedPosts: 5,
      lastPostTime: new Date().toISOString(),
      postsToday: 2,
      postsThisWeek: 14,
    });
  } catch (error) {
    logger.error('Get schedule status error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
