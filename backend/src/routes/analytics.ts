import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AnalyticsService } from '../services/analyticsService';

const router = Router();
const analyticsService = new AnalyticsService();

// Remove the duplicate authenticateToken definition - use the imported one

// Fix all route handlers by using analyticsService instead of postModel
router.get('/overview', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const days = req.query.days || '30';
    
    const analytics = await analyticsService.getUserAnalytics(userId, parseInt(days as string));
    
    res.json({
      totalPosts: analytics.totalPosts,
      totalEngagement: analytics.totalEngagement,
      avgEngagement: analytics.averageEngagementRate,
      growth: analytics.postingTrends.length > 0 ? 'positive' : 'stable'
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
    
    const analytics = await analyticsService.getUserAnalytics(userId, parseInt(days as string));
    const hashtagPerformance = analytics.categoryPerformance;
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
    
    const analytics = await analyticsService.getUserAnalytics(userId, parseInt(days as string));
    const videoPerformance = analytics.categoryPerformance;
    
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
    
    const analytics = await analyticsService.getUserAnalytics(userId, 30);
    const growth = analytics.postingTrends;
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
    
    const insights = await analyticsService.getEngagementInsights(userId, parseInt(days as string));
    const audience = insights.categoryInsights;
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
    
    const analytics = await analyticsService.getUserAnalytics(userId, parseInt(days as string));
    const competitorAnalysis = analytics.categoryPerformance;
    
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
    
    const analytics = await analyticsService.getUserAnalytics(userId, 30);
    const report = {
      type: reportType,
      dateRange,
      platforms,
      data: analytics,
      insights: await analyticsService.getEngagementInsights(userId, 30)
    };
    
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
    
    const exportData = await analyticsService.exportAnalytics(userId, format || 'csv');
    
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
    
    const insights = await analyticsService.getEngagementInsights(userId, parseInt(days as string));
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
    
    const analytics = await analyticsService.getUserAnalytics(userId, 30);
    const trends = analytics.postingTrends;
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
    
    const summary = await analyticsService.getEngagementInsights(userId, parseInt(days as string));
    res.json(summary);
    return;
  } catch (error) {
    console.error('Performance summary error:', error);
    res.status(500).json({ error: 'Failed to fetch performance summary' });
    return;
  }
});

export default router; 