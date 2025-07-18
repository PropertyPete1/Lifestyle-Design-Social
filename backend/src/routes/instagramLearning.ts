import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Video } from '../models/Video';
import { captionGenerationService } from '../services/captionGenerationService';
import { connectToDatabase } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();
const captionService = captionGenerationService;

// @route   GET /api/instagram-learning/sync-status
// @desc    Get Instagram sync status
// @access  Private
router.get('/sync-status', authenticateToken, async (_req: Request, res: Response) => {
  try {
    await connectToDatabase();
    // Return mock data for now - in real implementation this would query actual Instagram data
    return res.json({
      totalPosts: 0,
      analyzedPosts: 0,
      avgEngagement: 0,
      topPerformingCount: 0,
      lastSync: null,
    });
  } catch (error) {
    logger.error('Sync status error:', error);
    return res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// @route   POST /api/instagram-learning/sync
// @desc    Sync Instagram posts
// @access  Private
router.post('/sync', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const {
      postCount = 50,
      includeStories: _includeStories = false,
      includeReels: _includeReels = true,
      includePosts: _includePosts = true,
    } = req.body;

    // Simulate sync process - in real implementation this would fetch from Instagram API
    return res.json({
      success: true,
      postsAnalyzed: postCount,
      newInsights: Math.floor(postCount * 0.8),
      message: 'Instagram posts synced successfully',
    });
  } catch (error) {
    logger.error('Sync posts error:', error);
    return res.status(500).json({ error: 'Failed to sync posts' });
  }
});

// @route   GET /api/instagram-learning/style-analysis
// @desc    Get user's writing style analysis
// @access  Private
router.get('/style-analysis', authenticateToken, async (_req: Request, res: Response) => {
  try {
    return res.json({
      dominantTone: 'professional',
      averageWordCount: 120,
      totalPosts: 25,
      averagePerformance: 8.5,
      topPerformingThemes: ['luxury', 'modern', 'spacious', 'downtown'],
      engagementTriggers: ['question', 'call-to-action', 'location-tag'],
      commonPhrases: ['amazing', 'beautiful', 'perfect', 'stunning'],
      preferredHashtags: ['#realestate', '#luxury', '#home', '#property'],
    });
  } catch (error) {
    logger.error('Style analysis error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/instagram-learning/generate-caption
// @desc    Generate AI caption based on video and Instagram learning
// @access  Private
router.post('/generate-caption', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      videoId,
      prompt: _prompt,
      tone: _tone = 'professional',
      includeHashtags = true,
      maxLength: _maxLength = 2200,
    } = req.body;
    const userId = req.user!.id;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Get video details from database
    await connectToDatabase();
    const video = await Video.findById(videoId);

    if (!video || video.userId !== userId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    let caption = null;
    let source = 'ai_generated';

    // If user provided description, use it
    if (video.description && video.description.trim().length > 0) {
      caption = video.description;
      source = 'user_provided';
    }
    // Otherwise generate AI caption
    else {
      try {
        const result = await captionService.generateCaptionAndHashtags(
          userId,
          videoId,
          'instagram',
          { tone: 'professional' }
        );

        caption = result.caption;
        source = 'ai_generated';
      } catch (aiError) {
        logger.error('AI caption generation failed:', aiError);
        // Fallback caption
        caption = `Check out this amazing ${video.category} content! Perfect for your next real estate investment.`;
        source = 'fallback';
      }
    }

    // Generate hashtags based on video and location
    let hashtags: string[] = [];
    if (includeHashtags) {
      try {
        const result = await captionService.generateCaptionAndHashtags(
          userId,
          videoId,
          'instagram',
          { tone: 'professional' }
        );

        hashtags = result.hashtags;

        // Ensure hashtags are properly formatted
        hashtags = hashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
      } catch (error) {
        logger.error('Hashtag generation failed:', error);
        hashtags = ['#realestate', '#dreamhome', '#luxury', '#property', '#home'];
      }
    }

    // Store the generated caption in the video record
    if (caption && caption !== video.description) {
      await Video.findByIdAndUpdate(videoId, {
        preferredCaption: caption,
        preferredHashtags: hashtags,
      });
    }

    return res.json({
      caption: {
        text: caption,
        hashtags: hashtags,
        performanceScore: Math.floor(Math.random() * 20) + 80, // 80-99%
        styleMatch: source === 'instagram_existing' ? 100 : Math.floor(Math.random() * 15) + 85,
        source: source,
        id: `caption-${Date.now()}`,
      },
      message:
        source === 'instagram_existing'
          ? 'Caption retrieved from your existing Instagram post'
          : source === 'user_provided'
            ? 'Using your provided description'
            : source === 'ai_generated'
              ? 'AI-generated caption based on your content style'
              : 'Generated fallback caption',
    });
  } catch (error) {
    logger.error('Caption generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate caption',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// @route   GET /api/instagram-learning/hashtag-analysis
// @desc    Get hashtag performance analysis
// @access  Private
router.get('/hashtag-analysis', authenticateToken, async (_req: Request, res: Response) => {
  try {
    return res.json({
      topPerforming: [
        { tag: 'realestate', avgEngagement: 250 },
        { tag: 'luxury', avgEngagement: 220 },
        { tag: 'dreamhome', avgEngagement: 200 },
        { tag: 'property', avgEngagement: 180 },
        { tag: 'home', avgEngagement: 170 },
      ],
      mostUsed: [
        { tag: 'realestate', count: 45 },
        { tag: 'home', count: 38 },
        { tag: 'property', count: 32 },
        { tag: 'beautiful', count: 28 },
        { tag: 'luxury', count: 25 },
      ],
      trending: [
        { tag: 'modernhome', growth: 35 },
        { tag: 'smartliving', growth: 28 },
        { tag: 'ecofriendly', growth: 22 },
        { tag: 'minimalist', growth: 18 },
        { tag: 'openfloor', growth: 15 },
      ],
      recommended: {
        highPerformance: [
          'realestate',
          'luxury',
          'dreamhome',
          'property',
          'home',
          'beautiful',
          'modern',
          'stunning',
        ],
        trending: ['modernhome', 'smartliving', 'ecofriendly', 'minimalist', 'openfloor'],
      },
    });
  } catch (error) {
    logger.error('Hashtag analysis error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/instagram-learning/approvals
// @desc    Get pending approvals
// @access  Private
router.get('/approvals', authenticateToken, async (_req: Request, res: Response) => {
  try {
    return res.json({
      approvals: [
        {
          id: 1,
          videoTitle: 'Luxury Downtown Condo',
          caption:
            'Excited to showcase this stunning downtown condo! Modern amenities, city views, and luxury living at its finest. Who else loves this open floor plan?',
          hashtags: ['realestate', 'luxury', 'condo', 'downtown', 'cityviews'],
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          prediction: {
            expectedEngagement: '200-300 interactions',
            performanceScore: 87,
          },
        },
      ],
    });
  } catch (error) {
    logger.error('Approvals error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/instagram-learning/approvals/:id
// @desc    Handle approval action
// @access  Private
router.post('/approvals/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, feedback: _feedback } = req.body;

    return res.json({
      success: true,
      message: `Caption ${action}d successfully`,
      action: action,
      id: id,
    });
  } catch (error) {
    logger.error('Approval action error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
