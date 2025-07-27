import express from 'express';
import { phase9Monitor } from '../../services/phase9Monitor';
import { Phase9InstagramScraper } from '../../lib/youtube/phase9InstagramScraper';
import { InstagramContent } from '../../models/InstagramContent';
import { RepostQueue } from '../../models/RepostQueue';
import fs from 'fs';
import path from 'path';

const router = express.Router();

/**
 * GET /api/phase9/status
 * Get Phase 9 monitoring status and statistics
 */
router.get('/status', async (req, res) => {
  try {
    const status = await phase9Monitor.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Phase 9 Status API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/phase9/start
 * Start Phase 9 monitoring
 */
router.post('/start', async (req, res) => {
  try {
    await phase9Monitor.start();
    res.json({
      success: true,
      message: 'Phase 9 monitoring started successfully'
    });
  } catch (error) {
    console.error('❌ Phase 9 Start API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start Phase 9 monitoring'
    });
  }
});

/**
 * POST /api/phase9/stop
 * Stop Phase 9 monitoring
 */
router.post('/stop', async (req, res) => {
  try {
    phase9Monitor.stop();
    res.json({
      success: true,
      message: 'Phase 9 monitoring stopped successfully'
    });
  } catch (error) {
    console.error('❌ Phase 9 Stop API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop Phase 9 monitoring'
    });
  }
});

/**
 * POST /api/phase9/autopost-mode
 * Update auto-posting mode (off/dropbox/instagram)
 */
router.post('/autopost-mode', async (req, res) => {
  try {
    const { mode } = req.body;

    if (!mode || !['off', 'dropbox', 'instagram'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode. Must be "off", "dropbox", or "instagram"'
      });
    }

    await phase9Monitor.updateAutopostMode(mode);
    
    res.json({
      success: true,
      message: `Auto-posting mode updated to "${mode}"`,
      data: { autopostMode: mode }
    });
  } catch (error) {
    console.error('❌ Phase 9 Autopost Mode API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update autopost mode'
    });
  }
});

/**
 * POST /api/phase9/scrape
 * Manually trigger Instagram content scraping
 */
router.post('/scrape', async (req, res) => {
  try {
    const result = await phase9Monitor.triggerManualScraping();
    res.json({
      success: true,
      message: 'Instagram scraping completed',
      data: result
    });
  } catch (error) {
    console.error('❌ Phase 9 Manual Scraping API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger scraping'
    });
  }
});

/**
 * POST /api/phase9/repost
 * Manually trigger repost processing
 */
router.post('/repost', async (req, res) => {
  try {
    const result = await phase9Monitor.triggerManualReposting();
    res.json({
      success: true,
      message: 'Repost processing completed',
      data: result
    });
  } catch (error) {
    console.error('❌ Phase 9 Manual Reposting API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger reposting'
    });
  }
});

/**
 * GET /api/phase9/content
 * Get Instagram content with pagination and filtering
 */
router.get('/content', async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'performanceScore', order = 'desc', filter } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    let filterQuery: any = {};
    if (filter === 'top-performers') {
      filterQuery.isEligibleForRepost = true;
    } else if (filter === 'recent') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      filterQuery.scrapedAt = { $gte: yesterday };
    }

    // Build sort query
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortQuery: any = {};
    sortQuery[sortBy as string] = sortOrder;

    const [content, total] = await Promise.all([
      InstagramContent.find(filterQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      InstagramContent.countDocuments(filterQuery)
    ]);

    res.json({
      success: true,
      data: {
        content,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('❌ Phase 9 Content API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content'
    });
  }
});

/**
 * GET /api/phase9/repost-queue
 * Get repost queue with filtering and pagination
 */
router.get('/repost-queue', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, platform } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    let filterQuery: any = {};
    if (status) {
      filterQuery.status = status;
    }
    if (platform) {
      filterQuery.targetPlatform = platform;
    }

    const [queue, total] = await Promise.all([
      RepostQueue.find(filterQuery)
        .sort({ priority: 1, queuedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      RepostQueue.countDocuments(filterQuery)
    ]);

    res.json({
      success: true,
      data: {
        queue,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('❌ Phase 9 Repost Queue API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch repost queue'
    });
  }
});

/**
 * GET /api/phase9/analytics
 * Get comprehensive Phase 9 analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const [
      contentStats,
      queueStats,
      recentContent,
      topPerformers
    ] = await Promise.all([
      // Content statistics
      InstagramContent.aggregate([
        {
          $group: {
            _id: null,
            totalContent: { $sum: 1 },
            avgPerformanceScore: { $avg: '$performanceScore' },
            totalViews: { $sum: '$viewCount' },
            totalLikes: { $sum: '$likeCount' },
            totalComments: { $sum: '$commentCount' },
            eligibleContent: {
              $sum: { $cond: ['$isEligibleForRepost', 1, 0] }
            }
          }
        }
      ]),

      // Queue statistics
      RepostQueue.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Recent content count (last 24 hours)
      InstagramContent.countDocuments({
        scrapedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),

      // Top 5 performers
      InstagramContent.find({ isEligibleForRepost: true })
        .sort({ performanceScore: -1 })
        .limit(5)
        .select('igMediaId caption performanceScore viewCount likeCount commentCount repostPriority')
        .lean()
    ]);

    // Process queue stats
    const queueSummary = {
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };

    queueStats.forEach(stat => {
      if (stat._id in queueSummary) {
        queueSummary[stat._id as keyof typeof queueSummary] = stat.count;
      }
    });

    const analytics = {
      content: contentStats[0] || {
        totalContent: 0,
        avgPerformanceScore: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        eligibleContent: 0
      },
      queue: queueSummary,
      recentContent,
      topPerformers
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('❌ Phase 9 Analytics API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics'
    });
  }
});

/**
 * PUT /api/phase9/settings
 * Update Phase 9 settings
 */
router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid settings object'
      });
    }

    await phase9Monitor.updatePhase9Settings(settings);

    res.json({
      success: true,
      message: 'Phase 9 settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('❌ Phase 9 Settings API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings'
    });
  }
});

/**
 * DELETE /api/phase9/content/:id
 * Delete specific Instagram content
 */
router.delete('/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedContent = await InstagramContent.findByIdAndDelete(id);
    
    if (!deletedContent) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    // Also remove from repost queue if exists
    await RepostQueue.deleteMany({ sourceMediaId: deletedContent.igMediaId });

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('❌ Phase 9 Delete Content API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete content'
    });
  }
});

/**
 * DELETE /api/phase9/repost-queue/:id
 * Cancel/delete specific repost queue item
 */
router.delete('/repost-queue/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const queueItem = await RepostQueue.findById(id);
    
    if (!queueItem) {
      return res.status(404).json({
        success: false,
        error: 'Queue item not found'
      });
    }

    if (queueItem.status === 'processing') {
      // Just mark as cancelled, don't delete
      queueItem.status = 'cancelled';
      await queueItem.save();
    } else {
      // Delete if not currently processing
      await RepostQueue.findByIdAndDelete(id);
    }

    res.json({
      success: true,
      message: 'Repost queue item cancelled/deleted successfully'
    });
  } catch (error) {
    console.error('❌ Phase 9 Delete Queue Item API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel queue item'
    });
  }
});

/**
 * POST /api/phase9/test
 * Test Phase 9 functionality with sample data
 */
router.post('/test', async (req, res) => {
  try {
    console.log('🧪 Phase 9: Creating test data...');

    // Create sample Instagram content
    const sampleContent = [
      {
        igMediaId: 'test_ig_video_1',
        caption: 'Stunning luxury home in San Antonio Hills! 🏡✨ This 4-bedroom masterpiece features marble countertops, hardwood floors, and a resort-style backyard. Perfect for entertaining! #SanAntonio #LuxuryHomes #RealEstate #DreamHome #LifestyleDesign',
        media_url: 'https://example.com/sample_video_1.mp4',
        timestamp: new Date('2024-01-20T10:00:00Z'),
        viewCount: 2850,
        likeCount: 312,
        commentCount: 47,
        hashtags: ['#sanantonio', '#luxuryhomes', '#realestate', '#dreamhome', '#lifestyledesign'],
        performanceScore: 3488, // 2850 + 312*1.5 + 47*2
        mediaType: 'VIDEO' as const,
        permalink: 'https://instagram.com/p/sample1',
        isEligibleForRepost: true,
        repostPriority: 1
      },
      {
        igMediaId: 'test_ig_video_2',
        caption: 'JUST SOLD! 🔑 Another happy family finds their forever home in Texas! This beautiful property went under contract in just 3 days. The market is HOT right now! #JustSold #TexasRealEstate #FastSale #RealEstateAgent #SoldFast',
        media_url: 'https://example.com/sample_video_2.mp4',
        timestamp: new Date('2024-01-19T14:30:00Z'),
        viewCount: 1950,
        likeCount: 289,
        commentCount: 63,
        hashtags: ['#justsold', '#texasrealestate', '#fastsale', '#realestateagent', '#soldfast'],
        performanceScore: 2509, // 1950 + 289*1.5 + 63*2
        mediaType: 'VIDEO' as const,
        permalink: 'https://instagram.com/p/sample2',
        isEligibleForRepost: true,
        repostPriority: 2
      },
      {
        igMediaId: 'test_ig_video_3',
        caption: 'Behind the scenes: What happens during a home inspection? 🔍 Here\'s what buyers should expect and why it\'s SO important! Save this post for when you\'re ready to buy! #HomeInspection #BuyerTips #RealEstateEducation #FirstTimeBuyer',
        media_url: 'https://example.com/sample_video_3.mp4',
        timestamp: new Date('2024-01-17T11:45:00Z'),
        viewCount: 3200,
        likeCount: 445,
        commentCount: 78,
        hashtags: ['#homeinspection', '#buyertips', '#realestateeducation', '#firsttimebuyer'],
        performanceScore: 4023, // 3200 + 445*1.5 + 78*2
        mediaType: 'VIDEO' as const,
        permalink: 'https://instagram.com/p/sample3',
        isEligibleForRepost: true,
        repostPriority: 1
      }
    ];

    // Save to database
    const savedContent = [];
    for (const content of sampleContent) {
      const existing = await InstagramContent.findOne({ igMediaId: content.igMediaId });
      if (!existing) {
        const newContent = new InstagramContent(content);
        await newContent.save();
        savedContent.push(newContent);
      }
    }

    // Create sample repost queue entries
    const queueEntries = [];
    for (const content of savedContent) {
      // Queue for YouTube
      try {
        const youtubeQueue = new RepostQueue({
          sourceMediaId: content.igMediaId,
          targetPlatform: 'youtube',
          priority: content.repostPriority,
          scheduledFor: new Date(Date.now() + 60000), // 1 minute from now
          originalContent: {
            caption: content.caption,
            hashtags: content.hashtags,
            performanceScore: content.performanceScore,
            viewCount: content.viewCount,
            likeCount: content.likeCount,
            commentCount: content.commentCount,
            media_url: content.media_url,
            permalink: content.permalink
          }
        });
        await youtubeQueue.save();
        queueEntries.push(youtubeQueue);
      } catch (error) {
        // Might already exist
      }

      // Queue for Instagram
      try {
        const instagramQueue = new RepostQueue({
          sourceMediaId: content.igMediaId,
          targetPlatform: 'instagram',
          priority: content.repostPriority,
          scheduledFor: new Date(Date.now() + 120000), // 2 minutes from now
          originalContent: {
            caption: content.caption,
            hashtags: content.hashtags,
            performanceScore: content.performanceScore,
            viewCount: content.viewCount,
            likeCount: content.likeCount,
            commentCount: content.commentCount,
            media_url: content.media_url,
            permalink: content.permalink
          }
        });
        await instagramQueue.save();
        queueEntries.push(instagramQueue);
      } catch (error) {
        // Might already exist
      }
    }

    res.json({
      success: true,
      message: 'Phase 9 test data created successfully',
      data: {
        contentCreated: savedContent.length,
        queueEntriesCreated: queueEntries.length,
        sampleContent: savedContent,
        sampleQueue: queueEntries
      }
    });
  } catch (error) {
    console.error('❌ Phase 9 Test API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create test data'
    });
  }
});

export default router; 