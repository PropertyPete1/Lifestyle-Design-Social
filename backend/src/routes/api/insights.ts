import { Router } from 'express';
import { YouTubeScraper } from '../../services/youtubeScraper';
import { InstagramScraper } from '../../services/instagramScraper';
import { SmartRepostService } from '../../services/smartRepost';
import PostInsight from '../../models/PostInsights';
import TopHashtag from '../../models/TopHashtags';

const router = Router();

/**
 * POST /api/insights/scrape/youtube
 * Scrape YouTube channel for top performing videos
 */
router.post('/scrape/youtube', async (req, res) => {
  try {
    const { apiKey, channelId, refreshToken } = req.body;

    if (!apiKey || !channelId) {
      return res.status(400).json({
        error: 'YouTube API key and channel ID are required'
      });
    }

    const scraper = new YouTubeScraper(apiKey, channelId, refreshToken);
    const result = await scraper.performFullScrape();

    res.json({
      success: true,
      message: 'YouTube scraping completed successfully',
      data: result
    });
  } catch (error) {
    console.error('YouTube scraping error:', error);
    res.status(500).json({
      error: 'Failed to scrape YouTube channel',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/insights/scrape/instagram
 * Scrape Instagram page for top performing videos
 */
router.post('/scrape/instagram', async (req, res) => {
  try {
    const { accessToken, pageId } = req.body;

    if (!accessToken || !pageId) {
      return res.status(400).json({
        error: 'Instagram access token and page ID are required'
      });
    }

    const scraper = new InstagramScraper(accessToken, pageId);
    const result = await scraper.performFullScrape();

    res.json({
      success: true,
      message: 'Instagram scraping completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Instagram scraping error:', error);
    res.status(500).json({
      error: 'Failed to scrape Instagram page',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/insights/scrape/all
 * Scrape both YouTube and Instagram
 */
router.post('/scrape/all', async (req, res) => {
  try {
    const { youtube, instagram } = req.body;

    const results: {
      youtube: any;
      instagram: any;
      totalVideosScraped: number;
      totalHashtagsUpdated: number;
    } = {
      youtube: null,
      instagram: null,
      totalVideosScraped: 0,
      totalHashtagsUpdated: 0
    };

    // Scrape YouTube if credentials provided
    if (youtube?.apiKey && youtube?.channelId) {
      try {
        const ytScraper = new YouTubeScraper(youtube.apiKey, youtube.channelId, youtube.refreshToken);
        results.youtube = await ytScraper.performFullScrape();
        results.totalVideosScraped += results.youtube.videosScraped;
        results.totalHashtagsUpdated += results.youtube.hashtagsUpdated;
      } catch (ytError) {
        console.error('YouTube scraping failed:', ytError);
        results.youtube = { error: 'Failed to scrape YouTube' };
      }
    }

    // Scrape Instagram if credentials provided
    if (instagram?.accessToken && instagram?.pageId) {
      try {
        const igScraper = new InstagramScraper(instagram.accessToken, instagram.pageId);
        results.instagram = await igScraper.performFullScrape();
        results.totalVideosScraped += results.instagram.videosScraped;
        results.totalHashtagsUpdated += results.instagram.hashtagsUpdated;
      } catch (igError) {
        console.error('Instagram scraping failed:', igError);
        results.instagram = { error: 'Failed to scrape Instagram' };
      }
    }

    res.json({
      success: true,
      message: 'Scraping process completed',
      data: results
    });
  } catch (error) {
    console.error('Full scraping error:', error);
    res.status(500).json({
      error: 'Failed to complete scraping process',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/insights/videos
 * Get scraped video insights with pagination
 */
router.get('/videos', async (req, res) => {
  try {
    const { 
      platform, 
      page = 1, 
      limit = 20, 
      sortBy = 'performanceScore',
      sortOrder = 'desc' 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const query = platform ? { platform } : {};
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const videos = await PostInsight.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await PostInsight.countDocuments(query);

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching video insights:', error);
    res.status(500).json({
      error: 'Failed to fetch video insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/insights/hashtags
 * Get top performing hashtags
 */
router.get('/hashtags', async (req, res) => {
  try {
    const { 
      platform, 
      limit = 50,
      sortBy = 'avgViewScore',
      sortOrder = 'desc'
    } = req.query;

    const query = platform ? { platform } : {};
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const hashtags = await TopHashtag.find(query)
      .sort(sort)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: hashtags
    });
  } catch (error) {
    console.error('Error fetching top hashtags:', error);
    res.status(500).json({
      error: 'Failed to fetch top hashtags',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/insights/analytics
 * Get insights analytics summary
 */
router.get('/analytics', async (req, res) => {
  try {
    const [
      totalVideos,
      youtubeVideos,
      instagramVideos,
      totalHashtags,
      repostEligible,
      reposted
    ] = await Promise.all([
      PostInsight.countDocuments(),
      PostInsight.countDocuments({ platform: 'youtube' }),
      PostInsight.countDocuments({ platform: 'instagram' }),
      TopHashtag.countDocuments(),
      PostInsight.countDocuments({ repostEligible: true, reposted: false }),
      PostInsight.countDocuments({ reposted: true })
    ]);

    // Get top performing video per platform
    const topYouTube = await PostInsight.findOne({ platform: 'youtube' })
      .sort({ performanceScore: -1 })
      .select('videoId performanceScore views likes title')
      .lean();

    const topInstagram = await PostInsight.findOne({ platform: 'instagram' })
      .sort({ performanceScore: -1 })
      .select('videoId performanceScore views likes title')
      .lean();

    // Get average performance scores
    const avgPerformance = await PostInsight.aggregate([
      {
        $group: {
          _id: '$platform',
          avgPerformanceScore: { $avg: '$performanceScore' },
          avgViews: { $avg: '$views' },
          avgLikes: { $avg: '$likes' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalVideos,
          youtubeVideos,
          instagramVideos,
          totalHashtags,
          repostEligible,
          reposted
        },
        topPerformers: {
          youtube: topYouTube,
          instagram: topInstagram
        },
        averagePerformance: avgPerformance
      }
    });
  } catch (error) {
    console.error('Error fetching insights analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch insights analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/insights/repost/check
 * Check if repost should be triggered
 */
router.post('/repost/check', async (req, res) => {
  try {
    const repostService = new SmartRepostService();
    const shouldTrigger = await repostService.shouldTriggerRepost();

    if (shouldTrigger) {
      const candidates = await repostService.getRepostCandidates(3);
      
      res.json({
        success: true,
        data: {
          shouldTrigger: true,
          candidatesFound: candidates.length,
          candidates: candidates.map(c => ({
            videoId: c.videoId,
            platform: c.platform,
            performanceScore: c.performanceScore,
            title: c.title,
            views: c.views,
            likes: c.likes
          }))
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          shouldTrigger: false,
          message: 'Repost threshold not met'
        }
      });
    }
  } catch (error) {
    console.error('Error checking repost trigger:', error);
    res.status(500).json({
      error: 'Failed to check repost trigger',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/insights/repost/trigger
 * Manually trigger smart repost process
 */
router.post('/repost/trigger', async (req, res) => {
  try {
    const repostService = new SmartRepostService();
    const result = await repostService.performSmartRepost();

    res.json({
      success: true,
      message: 'Smart repost process completed',
      data: result
    });
  } catch (error) {
    console.error('Error triggering smart repost:', error);
    res.status(500).json({
      error: 'Failed to trigger smart repost',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/insights/clear
 * Clear all insights data (for testing)
 */
router.delete('/clear', async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'CLEAR_ALL_INSIGHTS') {
      return res.status(400).json({
        error: 'Confirmation required. Send { "confirm": "CLEAR_ALL_INSIGHTS" }'
      });
    }

    await Promise.all([
      PostInsight.deleteMany({}),
      TopHashtag.deleteMany({})
    ]);

    res.json({
      success: true,
      message: 'All insights data cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing insights data:', error);
    res.status(500).json({
      error: 'Failed to clear insights data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 