import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PostModel } from '../models/Post';
import { VideoModel } from '../models/Video';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();
const postModel = new PostModel(pool);
const videoModel = new VideoModel(pool);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// @route   GET /api/analytics/overview
// @desc    Get analytics overview
// @access  Private
router.get('/overview', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { days = 30 } = req.query;

    const overview = await postModel.getAnalyticsOverview(userId, parseInt(days as string));

    res.json({ overview });
  } catch (error) {
    logger.error('Get analytics overview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/engagement
// @desc    Get engagement metrics
// @access  Private
router.get('/engagement', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { days = 30, platform } = req.query;

    const engagement = await postModel.getEngagementMetrics(userId, {
      days: parseInt(days as string),
      platform: platform as 'instagram' | 'tiktok' | 'facebook',
    });

    res.json({ engagement });
  } catch (error) {
    logger.error('Get engagement metrics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/best-times
// @desc    Get best posting times analysis
// @access  Private
router.get('/best-times', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { days = 90 } = req.query;

    const bestTimes = await postModel.getBestPostingTimes(userId, parseInt(days as string));

    res.json({ bestTimes });
  } catch (error) {
    logger.error('Get best times error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/hashtag-performance
// @desc    Get hashtag performance analysis
// @access  Private
router.get('/hashtag-performance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { days = 30 } = req.query;

    const hashtagPerformance = await postModel.getHashtagPerformance(userId, parseInt(days as string));

    res.json({ hashtagPerformance });
  } catch (error) {
    logger.error('Get hashtag performance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/video-performance
// @desc    Get video performance analysis
// @access  Private
router.get('/video-performance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { days = 30, category } = req.query;

    const videoPerformance = await postModel.getVideoPerformance(userId, {
      days: parseInt(days as string),
      category: category as 'real-estate' | 'cartoon',
    });

    res.json({ videoPerformance });
  } catch (error) {
    logger.error('Get video performance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/growth
// @desc    Get growth metrics
// @access  Private
router.get('/growth', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { period = 'monthly' } = req.query;

    const growth = await postModel.getGrowthMetrics(userId, period as 'daily' | 'weekly' | 'monthly');

    res.json({ growth });
  } catch (error) {
    logger.error('Get growth metrics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/audience
// @desc    Get audience insights
// @access  Private
router.get('/audience', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { days = 30 } = req.query;

    const audience = await postModel.getAudienceInsights(userId, parseInt(days as string));

    res.json({ audience });
  } catch (error) {
    logger.error('Get audience insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/competitor
// @desc    Get competitor analysis
// @access  Private
router.get('/competitor', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { competitors = [] } = req.query;

    const competitorAnalysis = await postModel.getCompetitorAnalysis(
      userId,
      Array.isArray(competitors) ? competitors : [competitors as string]
    );

    res.json({ competitorAnalysis });
  } catch (error) {
    logger.error('Get competitor analysis error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/reports
// @desc    Get analytics reports
// @access  Private
router.get('/reports', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { type = 'weekly', format = 'json' } = req.query;

    const report = await postModel.generateAnalyticsReport(userId, {
      type: type as 'daily' | 'weekly' | 'monthly',
      format: format as 'json' | 'csv' | 'pdf',
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(report);
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(report);
    } else {
      res.json({ report });
    }
  } catch (error) {
    logger.error('Generate analytics report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/analytics/export
// @desc    Export analytics data
// @access  Private
router.post('/export', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { startDate, endDate, format = 'json', includePosts = true, includeVideos = true } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const exportData = await postModel.exportAnalyticsData(userId, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      format: format as 'json' | 'csv' | 'xlsx',
      includePosts,
      includeVideos,
    });

    const filename = `analytics-export-${new Date().toISOString().split('T')[0]}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(exportData);
    } else if (format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(exportData);
    } else {
      res.json({ data: exportData });
    }
  } catch (error) {
    logger.error('Export analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/insights
// @desc    Get AI-powered insights
// @access  Private
router.get('/insights', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { days = 30 } = req.query;

    const insights = await postModel.getAIInsights(userId, parseInt(days as string));

    res.json({ insights });
  } catch (error) {
    logger.error('Get AI insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/trends
// @desc    Get trending topics and hashtags
// @access  Private
router.get('/trends', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform = 'instagram' } = req.query;

    const trends = await postModel.getTrendingTopics(userId, platform as 'instagram' | 'tiktok' | 'facebook');

    res.json({ trends });
  } catch (error) {
    logger.error('Get trends error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/performance-summary
// @desc    Get performance summary dashboard
// @access  Private
router.get('/performance-summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { days = 30 } = req.query;

    const summary = await postModel.getPerformanceSummary(userId, parseInt(days as string));

    res.json({ summary });
  } catch (error) {
    logger.error('Get performance summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 