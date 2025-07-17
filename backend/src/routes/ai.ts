import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { captionGenerationService } from '../services/captionGenerationService';
import { Video } from '../models/Video';
import { connectToDatabase } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();
const captionService = captionGenerationService;

// @route   POST /api/ai/generate-caption
// @desc    Generate AI caption for video
// @access  Private
router.post('/generate-caption', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    
    const { videoId, platform = 'both', tone = 'professional' } = req.body;
    const userId = req.user!.id;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Find video and verify ownership
    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) {
      return res.status(404).json({ error: 'Video not found or access denied' });
    }

    // Generate caption using AI service
    const caption = await captionService.generateCaptionAndHashtags(
      userId,
      videoId,
      platform,
      { tone: 'professional' }
    );

    logger.info(`AI caption generated for video ${videoId} by user ${userId}`);
    
    return res.json({
      message: 'Caption generated successfully',
      caption,
      platform,
      tone
    });
  } catch (error) {
    logger.error('Generate caption error:', error);
    return res.status(500).json({ error: 'Failed to generate caption' });
  }
});

// @route   POST /api/ai/generate-hashtags
// @desc    Generate AI hashtags for video
// @access  Private
router.post('/generate-hashtags', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { videoId, platform = 'both', tone: _tone = 'professional' } = req.body;
    const userId = req.user!.id;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) {
      return res.status(404).json({ error: 'Video not found or access denied' });
    }

    const result = await captionService.generateCaptionAndHashtags(
      userId,
      videoId,
      platform,
      { tone: 'professional' }
    );

    return res.json({ hashtags: result.hashtags });
  } catch (error) {
    logger.error('Generate hashtags error:', error);
    return res.status(500).json({ error: 'Failed to generate hashtags' });
  }
});

// @route   POST /api/ai/generate-complete-post
// @desc    Generate complete AI post content
// @access  Private
router.post('/generate-complete-post', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { videoId, platform = 'both', tone: _tone = 'professional' } = req.body;
    const userId = req.user!.id;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) {
      return res.status(404).json({ error: 'Video not found or access denied' });
    }

    const postContent = await captionService.generateCaptionAndHashtags(
      userId,
      videoId,
      platform,
      { tone: 'professional' }
    );

    return res.json({
      caption: postContent.caption,
      hashtags: postContent.hashtags,
      // Note: confidence and source are not available in GeneratedCaption interface
      // These properties would need to be added to the interface if required
    });
  } catch (error) {
    logger.error('Generate complete post error:', error);
    return res.status(500).json({ error: 'Failed to generate post content' });
  }
});

// @route   GET /api/ai/optimal-times
// @desc    Get AI-suggested optimal posting times
// @access  Private
router.get('/optimal-times', authenticateToken, async (_req: Request, res: Response) => {
  try {
    // Return default optimal times based on real estate industry best practices
    const optimalTimes = [
      '09:00', // 9 AM - Morning commute
      '13:00', // 1 PM - Lunch break
      '18:00', // 6 PM - Evening commute
      '20:00', // 8 PM - Evening social media time
    ];
    
    return res.json({ optimalTimes });
  } catch (error) {
    logger.error('Get optimal times error:', error);
    return res.status(500).json({ error: 'Failed to get optimal times' });
  }
});

// @route   POST /api/ai/analyze-engagement
// @desc    Analyze post engagement and provide insights
// @access  Private
router.post('/analyze-engagement', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { postId: _postId } = req.body;
    // const _userId = req.user!.id;

    // Basic analysis for now - can be enhanced with actual data analysis
    const analysis = {
      insights: [
        "Your video content is performing well with consistent engagement",
        "Consider posting during peak hours (9-11 AM or 7-9 PM) for better reach",
        "Real estate content typically performs better on weekdays"
      ],
      recommendations: [
        "Add more location-specific hashtags",
        "Include property details in captions",
        "Use trending real estate hashtags"
      ],
      bestPostingTimes: ['09:00', '13:00', '18:00'],
      engagementTrends: {
        weekdays: 'higher',
        weekends: 'lower',
        bestDay: 'Tuesday'
      }
    };

    return res.json({ analysis });
  } catch (error) {
    logger.error('Analyze engagement error:', error);
    return res.status(500).json({ error: 'Failed to analyze engagement' });
  }
});

export default router; 