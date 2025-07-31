import express from 'express';
import { trendingAudioService } from '../../services/trendingAudioService';

const router = express.Router();

/**
 * GET /api/audio/trending - Get trending audio for a platform
 */
router.get('/trending', async (req, res) => {
  try {
    const platform = req.query.platform as 'instagram' | 'youtube';
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!platform || !['instagram', 'youtube'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Platform must be "instagram" or "youtube"'
      });
    }
    
    const trendingAudio = await trendingAudioService.getTrendingAudio(platform, limit);
    
    res.json({
      success: true,
      data: {
        platform,
        audio: trendingAudio,
        count: trendingAudio.length
      }
    });
  } catch (error) {
    console.error('❌ API: Failed to get trending audio:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/audio/random - Get random trending audio for a platform
 */
router.get('/random', async (req, res) => {
  try {
    const platform = req.query.platform as 'instagram' | 'youtube';
    
    if (!platform || !['instagram', 'youtube'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Platform must be "instagram" or "youtube"'
      });
    }
    
    const audioId = await trendingAudioService.getRandomTrendingAudio(platform);
    const metadata = await trendingAudioService.getAudioMetadata(audioId);
    
    res.json({
      success: true,
      data: {
        audioId,
        metadata
      }
    });
  } catch (error) {
    console.error('❌ API: Failed to get random trending audio:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/audio/search - Search for audio by keywords
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const platform = req.query.platform as 'instagram' | 'youtube' | undefined;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    
    const results = await trendingAudioService.searchAudio(query, platform);
    
    res.json({
      success: true,
      data: {
        query,
        platform: platform || 'all',
        results,
        count: results.length
      }
    });
  } catch (error) {
    console.error('❌ API: Failed to search audio:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/audio/refresh - Refresh trending audio data
 */
router.post('/refresh', async (req, res) => {
  try {
    const results = await trendingAudioService.refreshTrendingData();
    
    res.json({
      success: true,
      message: 'Trending audio data refreshed successfully',
      data: results
    });
  } catch (error) {
    console.error('❌ API: Failed to refresh trending audio:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;