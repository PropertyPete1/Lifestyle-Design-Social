import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PostModel } from '../models/Post';
import { VideoModel } from '../models/Video';
import { AnalyticsService } from '../services/analyticsService';

const router = Router();
const postModel = new PostModel();
const videoModel = new VideoModel();
const analyticsService = new AnalyticsService();

// Remove the duplicate authenticateToken definition since we're importing it

// Fix all route handlers by adding proper return statements
router.get('/overview', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const days = req.query.days || '30';
    
    // Use analyticsService instead of postModel for analytics methods
    const engagement = await analyticsService.getEngagementMetrics(userId, {
      days: parseInt(days as string),
      platforms: ['instagram', 'tiktok', 'facebook']
    });
    
    res.json({
      totalPosts: engagement.totalPosts,
      totalEngagement: engagement.totalEngagement,
      avgEngagement: engagement.avgEngagement,
      growth: engagement.growth
    });
    return;
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
    return;
  }
});

router.get('/posting-times', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const days = req.query.days || '30';
    
    const bestTimes = await analyticsService.getBestPostingTimes(userId, parseInt(days as string));
    res.json(bestTimes);
    return;
  } catch (error) {
    console.error('Best posting times error:', error);
    res.status(500).json({ error: 'Failed to fetch best posting times' });
    return;
  }
});

router.get('/hashtag-performance', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const days = req.query.days || '30';
    
    const hashtagPerformance = await analyticsService.getHashtagPerformance(userId, parseInt(days as string));
    res.json(hashtagPerformance);
    return;
  } catch (error) {
    console.error('Hashtag performance error:', error);
    res.status(500).json({ error: 'Failed to fetch hashtag performance' });
    return;
  }
});

router.get('/video-performance', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const days = req.query.days || '30';
    
    const videoPerformance = await analyticsService.getVideoPerformance(userId, {
      days: parseInt(days as string),
      platforms: ['instagram', 'tiktok', 'facebook']
    });
    
    res.json(videoPerformance);
    return;
  } catch (error) {
    console.error('Video performance error:', error);
    res.status(500).json({ error: 'Failed to fetch video performance' });
    return;
  }
});

router.get('/growth', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const period = req.query.period || 'daily';
    
    const growth = await analyticsService.getGrowthMetrics(userId, period as 'daily' | 'weekly' | 'monthly');
    res.json(growth);
    return;
  } catch (error) {
    console.error('Growth metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch growth metrics' });
    return;
  }
});

router.get('/audience', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const days = req.query.days || '30';
    
    const audience = await analyticsService.getAudienceInsights(userId, parseInt(days as string));
    res.json(audience);
    return;
  } catch (error) {
    console.error('Audience insights error:', error);
    res.status(500).json({ error: 'Failed to fetch audience insights' });
    return;
  }
});

router.get('/competitor-analysis', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const platform = req.query.platform || 'instagram';
    const days = req.query.days || '30';
    
    const competitorAnalysis = await analyticsService.getCompetitorAnalysis(
      userId,
      platform as string,
      parseInt(days as string)
    );
    
    res.json(competitorAnalysis);
    return;
  } catch (error) {
    console.error('Competitor analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch competitor analysis' });
    return;
  }
});

router.post('/generate-report', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { reportType, dateRange, platforms } = req.body;
    
    const report = await analyticsService.generateAnalyticsReport(userId, {
      reportType,
      dateRange,
      platforms,
      includeInsights: true,
      includeRecommendations: true
    });
    
    res.json(report);
    return;
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Failed to generate analytics report' });
    return;
  }
});

router.post('/export', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { format, dateRange, metrics } = req.body;
    
    const exportData = await analyticsService.exportAnalyticsData(userId, {
      format: format || 'csv',
      dateRange: dateRange || { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
      metrics: metrics || ['engagement', 'reach', 'impressions']
    });
    
    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.${format}"`);
    res.send(exportData);
    return;
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Failed to export analytics data' });
    return;
  }
});

router.get('/ai-insights', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const days = req.query.days || '30';
    
    const insights = await analyticsService.getAIInsights(userId, parseInt(days as string));
    res.json(insights);
    return;
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
    return;
  }
});

router.get('/trending-topics', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const platform = req.query.platform || 'instagram';
    
    const trends = await analyticsService.getTrendingTopics(userId, platform as 'instagram' | 'tiktok' | 'facebook');
    res.json(trends);
    return;
  } catch (error) {
    console.error('Trending topics error:', error);
    res.status(500).json({ error: 'Failed to fetch trending topics' });
    return;
  }
});

router.get('/performance-summary', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const days = req.query.days || '30';
    
    const summary = await analyticsService.getPerformanceSummary(userId, parseInt(days as string));
    res.json(summary);
    return;
  } catch (error) {
    console.error('Performance summary error:', error);
    res.status(500).json({ error: 'Failed to fetch performance summary' });
    return;
  }
});

export default router; 