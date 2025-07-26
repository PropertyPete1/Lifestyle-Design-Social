import express, { Request, Response } from 'express';
import { AudioMatchingService } from '../../services/audioMatchingService';
import { TrendingAudioScraper } from '../../services/trendingAudioScraper';
import { AudioMatch } from '../../models/AudioMatch';

const router = express.Router();
const audioMatchingService = new AudioMatchingService();
const audioScraper = new TrendingAudioScraper();

/**
 * GET /api/audio/match/:videoId
 * Match a specific video with trending audio
 */
router.get('/match/:videoId', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    
    const audioMatch = await audioMatchingService.matchVideoWithAudio(videoId);
    
    if (!audioMatch) {
      return res.status(404).json({
        success: false,
        message: 'No suitable audio match found for this video'
      });
    }

    res.json({
      success: true,
      data: audioMatch
    });
  } catch (error) {
    console.error('Error matching audio for video:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/audio/match-all
 * Match all pending videos with trending audio
 */
router.post('/match-all', async (req: Request, res: Response) => {
  try {
    const matches = await audioMatchingService.matchAllPendingVideos();
    
    res.json({
      success: true,
      message: `Successfully matched ${matches.length} videos with trending audio`,
      data: matches
    });
  } catch (error) {
    console.error('Error matching all videos:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/audio/trending/:platform
 * Get trending audio for a specific platform
 */
router.get('/trending/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    
    if (platform !== 'youtube' && platform !== 'instagram') {
      return res.status(400).json({
        success: false,
        message: 'Platform must be either "youtube" or "instagram"'
      });
    }

    let trendingAudio;
    if (platform === 'youtube') {
      trendingAudio = await audioScraper.fetchYouTubeTrendingAudio();
    } else {
      trendingAudio = await audioScraper.fetchInstagramTrendingAudio();
    }

    res.json({
      success: true,
      data: trendingAudio
    });
  } catch (error) {
    console.error('Error fetching trending audio:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/audio/trending
 * Get trending audio from all platforms
 */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const trendingAudio = await audioScraper.getAllTrendingAudio();

    res.json({
      success: true,
      data: trendingAudio
    });
  } catch (error) {
    console.error('Error fetching all trending audio:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/audio/matches/:videoId
 * Get audio matches for a specific video
 */
router.get('/matches/:videoId', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    
    const matches = await AudioMatch.find({ videoId }).sort({ matchedAt: -1 });
    
    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error fetching audio matches:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/audio/matches
 * Get all audio matches with optional filtering
 */
router.get('/matches', async (req: Request, res: Response) => {
  try {
    const { platform, status, limit = 50 } = req.query;
    
    const filter: any = {};
    if (platform) filter.platform = platform;
    if (status) filter.status = status;
    
    const matches = await AudioMatch.find(filter)
      .sort({ matchedAt: -1 })
      .limit(parseInt(limit as string));
    
    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error fetching audio matches:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/audio/matches/:matchId/status
 * Update audio match status (e.g., mark as applied)
 */
router.put('/matches/:matchId/status', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { status, errorMessage } = req.body;
    
    if (!['matched', 'applied', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: matched, applied, failed'
      });
    }

    const audioMatch = await AudioMatch.findByIdAndUpdate(
      matchId,
      { 
        status,
        ...(errorMessage && { errorMessage })
      },
      { new: true }
    );

    if (!audioMatch) {
      return res.status(404).json({
        success: false,
        message: 'Audio match not found'
      });
    }

    res.json({
      success: true,
      data: audioMatch
    });
  } catch (error) {
    console.error('Error updating audio match status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/audio/matches/:matchId
 * Delete an audio match
 */
router.delete('/matches/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    
    const audioMatch = await AudioMatch.findByIdAndDelete(matchId);

    if (!audioMatch) {
      return res.status(404).json({
        success: false,
        message: 'Audio match not found'
      });
    }

    res.json({
      success: true,
      message: 'Audio match deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting audio match:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 