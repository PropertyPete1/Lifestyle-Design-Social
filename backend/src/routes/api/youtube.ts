import express, { Request, Response } from 'express';
import { fetchAllVideosFromChannel, getAllSavedVideos } from '../../lib/youtube/fetchAllVideos';
import { analyzeTopHashtags, getTopInsights, clearAllInsights } from '../../lib/youtube/analyzeTopHashtags';

const router = express.Router();

// POST /api/youtube/fetch-all-videos
// Scrape all videos from a YouTube channel
router.post('/fetch-all-videos', async (req: Request, res: Response) => {
  try {
    const { channelId } = req.body;

    if (!channelId || typeof channelId !== 'string') {
      return res.status(400).json({ 
        error: 'Channel ID is required and must be a string' 
      });
    }

    // Validate channel ID format (should start with UC and be 24 characters)
    if (!channelId.startsWith('UC') || channelId.length !== 24) {
      return res.status(400).json({ 
        error: 'Invalid YouTube Channel ID format. Should start with "UC" and be 24 characters long.' 
      });
    }

    console.log(`Starting to fetch videos for channel: ${channelId}`);
    const videos = await fetchAllVideosFromChannel(channelId);

    res.json({
      success: true,
      message: `Successfully fetched ${videos.length} videos`,
      videos: videos.slice(0, 100), // Return first 100 for display
      totalCount: videos.length
    });

  } catch (error: any) {
    console.error('Error fetching YouTube videos:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch YouTube videos'
    });
  }
});

// POST /api/youtube/analyze-hashtags
// Analyze hashtags from saved videos
router.post('/analyze-hashtags', async (req: Request, res: Response) => {
  try {
    console.log('Starting hashtag analysis...');
    const insights = await analyzeTopHashtags();

    res.json({
      success: true,
      message: `Analyzed ${insights.length} hashtags`,
      insights: insights.slice(0, 50), // Return top 50
      totalCount: insights.length
    });

  } catch (error: any) {
    console.error('Error analyzing hashtags:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze hashtags'
    });
  }
});

// GET /api/youtube/videos
// Get all saved videos
router.get('/videos', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const videos = await getAllSavedVideos();

    res.json({
      success: true,
      videos: videos.slice(0, limit),
      totalCount: videos.length
    });

  } catch (error: any) {
    console.error('Error getting saved videos:', error);
    res.status(500).json({
      error: error.message || 'Failed to get saved videos'
    });
  }
});

// GET /api/youtube/insights
// Get hashtag insights
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const insights = await getTopInsights(limit);

    res.json({
      success: true,
      insights,
      totalCount: insights.length
    });

  } catch (error: any) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      error: error.message || 'Failed to get insights'
    });
  }
});

// DELETE /api/youtube/insights
// Clear all insights (for testing purposes)
router.delete('/insights', async (req: Request, res: Response) => {
  try {
    await clearAllInsights();

    res.json({
      success: true,
      message: 'All insights cleared successfully'
    });

  } catch (error: any) {
    console.error('Error clearing insights:', error);
    res.status(500).json({
      error: error.message || 'Failed to clear insights'
    });
  }
});

// GET /api/youtube/status
// Check YouTube integration status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'YouTube API endpoints are ready',
    endpoints: [
      'POST /api/youtube/fetch-all-videos',
      'POST /api/youtube/analyze-hashtags',
      'GET /api/youtube/videos',
      'GET /api/youtube/insights',
      'DELETE /api/youtube/insights'
    ]
  });
});

export default router; 