import express from 'express';
import { phase9Monitor } from '../../services/phase9Monitor';
import { InstagramArchive } from '../../models/InstagramContent';

const router = express.Router();

/**
 * Start Phase 9 monitoring with dual-platform automation
 */
router.post('/start', async (req, res) => {
  try {
    console.log('🚀 API: Starting Phase 9 dual-platform monitoring...');
    await phase9Monitor.start();
    
    res.json({
      success: true,
      message: 'Phase 9 dual-platform monitoring started successfully'
    });
  } catch (error) {
    console.error('❌ API: Failed to start Phase 9 monitoring:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Stop Phase 9 monitoring
 */
router.post('/stop', async (req, res) => {
  try {
    console.log('🛑 API: Stopping Phase 9 monitoring...');
    phase9Monitor.stop();
    
    res.json({
      success: true,
      message: 'Phase 9 monitoring stopped successfully'
    });
  } catch (error) {
    console.error('❌ API: Failed to stop Phase 9 monitoring:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get comprehensive Phase 9 status and statistics
 */
router.get('/status', async (req, res) => {
  try {
    console.log('📊 API: Getting Phase 9 status...');
    const status = await phase9Monitor.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ API: Failed to get Phase 9 status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Manually trigger Instagram content scraping
 */
router.post('/scrape', async (req, res) => {
  try {
    console.log('🔄 API: Manual Instagram scraping triggered...');
    const result = await phase9Monitor.triggerManualScraping();
    
    res.json({
      success: true,
      message: 'Instagram scraping completed successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ API: Manual scraping failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Manually trigger dual-platform reposting
 */
router.post('/repost', async (req, res) => {
  try {
    console.log('🚀 API: Manual dual-platform reposting triggered...');
    const result = await phase9Monitor.triggerManualReposting();
    
    res.json({
      success: true,
      message: 'Dual-platform reposting completed successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ API: Manual reposting failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Manually trigger weekly scheduling
 */
router.post('/schedule-week', async (req, res) => {
  try {
    console.log('📅 API: Manual weekly scheduling triggered...');
    const result = await phase9Monitor.triggerWeeklyScheduling();
    
    res.json({
      success: true,
      message: 'Weekly scheduling completed successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ API: Weekly scheduling failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update Phase 9 autopilot mode
 */
router.post('/autopilot-mode', async (req, res) => {
  try {
    const { mode } = req.body;
    
    if (!mode || !['off', 'dropbox', 'instagram', 'both'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode. Must be one of: off, dropbox, instagram, both'
      });
    }
    
    console.log(`🔄 API: Updating Phase 9 autopilot mode to "${mode}"...`);
    await phase9Monitor.updatePhase9AutopilotMode(mode);
    
    res.json({
      success: true,
      message: `Phase 9 autopilot mode updated to "${mode}"`
    });
  } catch (error) {
    console.error('❌ API: Failed to update autopilot mode:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update Phase 9 settings
 */
router.post('/settings', async (req, res) => {
  try {
    const settings = req.body;
    
    console.log('🔄 API: Updating Phase 9 settings...');
    await phase9Monitor.updatePhase9Settings(settings);
    
    res.json({
      success: true,
      message: 'Phase 9 settings updated successfully'
    });
  } catch (error) {
    console.error('❌ API: Failed to update Phase 9 settings:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Clean up placeholder and test data
 */
router.post('/cleanup', async (req, res) => {
  try {
    console.log('🧹 API: Cleaning up placeholder data...');
    const result = await phase9Monitor.cleanupPlaceholderData();
    
    res.json({
      success: result.success,
      message: 'Placeholder data cleanup completed',
      data: result.deletedCounts
    });
  } catch (error) {
    console.error('❌ API: Failed to cleanup placeholder data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get Instagram archive data for frontend display
 */
router.get('/instagram-archive', async (req, res) => {
  try {
    const { InstagramArchive } = require('../../models/InstagramContent');
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const posts = await InstagramArchive.find({
      mediaType: 'VIDEO'
    })
    .sort({ performanceScore: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
    const totalPosts = await InstagramArchive.countDocuments({ mediaType: 'VIDEO' });
    const topPerformers = await InstagramArchive.countDocuments({ 
      mediaType: 'VIDEO', 
      repostEligible: true 
    });
    
    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit)
        },
        stats: {
          totalPosts,
          topPerformers
        }
      }
    });
  } catch (error) {
    console.error('❌ API: Failed to get Instagram archive:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get repost queue data for frontend display
 */
router.get('/repost-queue', async (req, res) => {
  try {
    const { RepostQueue } = require('../../models/RepostQueue');
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const platform = req.query.platform as string;
    
    const filter: any = {};
    if (status && ['queued', 'processing', 'completed', 'failed'].includes(status)) {
      filter.status = status;
    }
    if (platform && ['instagram', 'youtube'].includes(platform)) {
      filter.targetPlatform = platform;
    }
    
    const posts = await RepostQueue.find(filter)
    .sort({ priority: 1, scheduledFor: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
    const totalPosts = await RepostQueue.countDocuments(filter);
    
    // Get stats by status and platform
    const statusStats = await RepostQueue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const platformStats = await RepostQueue.aggregate([
      { $group: { _id: '$targetPlatform', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        queue: posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit)
        },
        stats: {
          byStatus: statusStats.reduce((acc: any, stat: any) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
          byPlatform: platformStats.reduce((acc: any, stat: any) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        }
      }
    });
  } catch (error) {
    console.error('❌ API: Failed to get repost queue:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get weekly schedule overview
 */
router.get('/weekly-schedule', async (req, res) => {
  try {
    const { RepostQueue } = require('../../models/RepostQueue');
    
    // Get posts scheduled for the next 7 days
    const weekStart = new Date();
    const weekEnd = new Date();
    weekEnd.setDate(weekStart.getDate() + 7);
    
    const scheduledPosts = await RepostQueue.find({
      status: 'queued',
      scheduledFor: { $gte: weekStart, $lte: weekEnd }
    })
    .sort({ scheduledFor: 1 })
    .lean();
    
    // Group by day and platform
    const weekSchedule: { [key: string]: { instagram: any[], youtube: any[] } } = {};
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (const post of scheduledPosts) {
      const dayName = daysOfWeek[post.scheduledFor.getDay()];
      if (!weekSchedule[dayName]) {
        weekSchedule[dayName] = { instagram: [], youtube: [] };
      }
      const platform = post.targetPlatform as 'instagram' | 'youtube';
      if (platform === 'instagram' || platform === 'youtube') {
        weekSchedule[dayName][platform].push(post);
      }
    }
    
    res.json({
      success: true,
      data: {
        weekSchedule,
        totalScheduled: scheduledPosts.length,
        scheduledByPlatform: {
          instagram: scheduledPosts.filter((p: any) => p.targetPlatform === 'instagram').length,
          youtube: scheduledPosts.filter((p: any) => p.targetPlatform === 'youtube').length
        }
      }
    });
  } catch (error) {
    console.error('❌ API: Failed to get weekly schedule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Phase 9 API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Content endpoint for frontend
router.get('/content', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const sortBy = req.query.sortBy as string || 'performanceScore';
    const order = req.query.order as string || 'desc';
    
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortQuery: any = {};
    sortQuery[sortBy] = sortOrder;
    
    const content = await InstagramArchive.find({
      mediaType: 'VIDEO',
      performanceScore: { $gt: 1000 }
    })
    .sort(sortQuery)
    .limit(limit);
    
    res.json({
      success: true,
      data: {
        content: content
      },
      pagination: {
        limit,
        total: content.length,
        sortBy,
        order
      }
    });
  } catch (error) {
    console.error('❌ Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Analytics endpoint for frontend
router.get('/analytics', async (req, res) => {
  try {
    const stats = await phase9Monitor.getStatus();
    
    // Get top performers from Instagram archive
    const topPerformers = await InstagramArchive.find({
      mediaType: 'VIDEO',
      performanceScore: { $gt: 1000 }
    })
    .sort({ performanceScore: -1 })
    .limit(10);
    
    // Calculate eligible content (posts that can be reposted)
    const eligibleCount = await InstagramArchive.countDocuments({
      mediaType: 'VIDEO',
      repostEligible: true,
      performanceScore: { $gt: 1000 }
    });
    
    // Structure analytics to match frontend expectations
    const analytics = {
      content: {
        totalContent: stats.scraperStats.totalPosts,
        avgPerformanceScore: stats.scraperStats.avgPerformanceScore,
        totalViews: stats.scraperStats.totalViews || 0,
        totalLikes: 0, // Calculate from actual data if needed
        totalComments: 0, // Calculate from actual data if needed
        eligibleContent: eligibleCount
      },
      queue: {
        queued: stats.dualPlatformStats.totalQueued,
        processing: 0, // No processing status in current system
        completed: stats.dualPlatformStats.totalSuccessful,
        failed: stats.dualPlatformStats.totalFailed,
        cancelled: 0 // No cancelled status in current system
      },
      recentContent: stats.scraperStats.recentPosts || stats.scraperStats.totalPosts,
      topPerformers: topPerformers
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 