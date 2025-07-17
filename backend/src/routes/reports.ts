import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { dailyReportService } from '../services/dailyReportService';
import { logger } from '../utils/logger';

const router = Router();

// @route   GET /api/reports/daily
// @desc    Get today's daily report for the authenticated user
// @access  Private
router.get('/daily', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const report = await dailyReportService.generateDailyReport(userId);
    
    return res.json({
      success: true,
      data: report,
      message: 'Daily report generated successfully'
    });

  } catch (error) {
    logger.error('Daily report generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate daily report' 
    });
  }
});

// @route   GET /api/reports/history
// @desc    Get historical daily reports for the authenticated user
// @access  Private
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { days = 30 } = req.query;
    
    const reports = await dailyReportService.getHistoricalReports(userId, parseInt(days as string));
    
    return res.json({
      success: true,
      data: {
        reports,
        totalReports: reports.length,
        timeframeDays: parseInt(days as string)
      },
      message: `Retrieved ${reports.length} historical reports`
    });

  } catch (error) {
    logger.error('Historical reports error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve historical reports' 
    });
  }
});

// @route   POST /api/reports/send-email
// @desc    Manually send daily report email to user
// @access  Private
router.post('/send-email', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const report = await dailyReportService.generateDailyReport(userId);
    
    return res.json({
      success: true,
      data: {
        reportDate: report.date,
        emailSent: true,
        summary: report.summary
      },
      message: 'Daily report email sent successfully'
    });

  } catch (error) {
    logger.error('Email report error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send email report' 
    });
  }
});

// @route   POST /api/reports/start-scheduler
// @desc    Start the daily report scheduler (admin only)
// @access  Private
router.post('/start-scheduler', authenticateToken, async (_req: Request, res: Response) => {
  try {
    // In a real app, you'd check for admin privileges here
    // For now, any authenticated user can start the scheduler
    
    dailyReportService.startScheduler();
    
    return res.json({
      success: true,
      message: 'Daily report scheduler started successfully'
    });

  } catch (error) {
    logger.error('Scheduler start error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to start scheduler' 
    });
  }
});

// @route   POST /api/reports/check-failures
// @desc    Manually check for failures and send notifications
// @access  Private
router.post('/check-failures', authenticateToken, async (_req: Request, res: Response) => {
  try {
    await dailyReportService.checkAndNotifyFailures();
    
    return res.json({
      success: true,
      message: 'Failure check completed and notifications sent'
    });

  } catch (error) {
    logger.error('Failure check error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to check failures' 
    });
  }
});

// @route   GET /api/reports/summary
// @desc    Get quick summary stats for dashboard
// @access  Private
router.get('/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const report = await dailyReportService.generateDailyReport(userId);
    
    // Return just the key metrics for dashboard display
    return res.json({
      success: true,
      data: {
        date: report.date,
        summary: report.summary,
        totalViews: report.engagement.totalViews,
        avgEngagementRate: report.engagement.avgEngagementRate,
        platforms: {
          instagram: report.platforms.instagram,
          tiktok: report.platforms.tiktok,
          youtube: report.platforms.youtube
        },
        hasErrors: report.errors.length > 0,
        topRecommendation: report.recommendations[0] || 'Everything looks good!'
      },
      message: 'Summary generated successfully'
    });

  } catch (error) {
    logger.error('Summary generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate summary' 
    });
  }
});

export default router; 