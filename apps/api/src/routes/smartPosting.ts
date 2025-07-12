// ========================================
// Smart Posting API Routes
// ========================================

import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { SmartPostingService } from '../services/smartPostingService';
import { logger } from '../utils/logger';
import { SocialPlatform, CaptionTone, CaptionStyle, HashtagStrategyType, VideoCategory } from '@shared/types';

const router = Router();
const smartPostingService = new SmartPostingService();

// ========================================
// Optimal Posting Time Analysis
// ========================================

/**
 * @route   GET /api/smart-posting/optimal-times
 * @desc    Get optimal posting times for user and platform
 * @access  Private
 */
router.get('/optimal-times',
  authenticateToken,
  [
    query('platform')
      .isIn(Object.values(SocialPlatform))
      .withMessage('Valid platform required'),
    query('days')
      .optional()
      .isInt({ min: 7, max: 90 })
      .withMessage('Days must be between 7 and 90'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { platform, days = 30 } = req.query;
      const userId = (req as any).userId;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));

      const analysis = await smartPostingService.analyzeOptimalPostingTimes(
        userId,
        platform as SocialPlatform,
        { start: startDate, end: endDate }
      );

      logger.info(`Optimal posting times analyzed for user ${userId} on ${platform}`);

      res.json({
        success: true,
        data: analysis,
        message: 'Optimal posting times analyzed successfully'
      });

    } catch (error) {
      logger.error('Get optimal posting times error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze optimal posting times'
      });
    }
  }
);

/**
 * @route   POST /api/smart-posting/schedule-optimal
 * @desc    Schedule posts at optimal times
 * @access  Private
 */
router.post('/schedule-optimal',
  authenticateToken,
  [
    body('videoIds')
      .isArray({ min: 1 })
      .withMessage('Video IDs array required'),
    body('platforms')
      .isArray({ min: 1 })
      .withMessage('Platforms array required'),
    body('startDate')
      .isISO8601()
      .withMessage('Valid start date required'),
    body('postsPerDay')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Posts per day must be between 1 and 10'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { videoIds, platforms, startDate, postsPerDay = 3 } = req.body;
      const userId = (req as any).userId;

      const scheduleResult = await smartPostingService.scheduleOptimalPosts({
        userId,
        videoIds,
        platforms,
        startDate: new Date(startDate),
        postsPerDay
      });

      logger.info(`Optimal posting schedule created for user ${userId}`);

      res.json({
        success: true,
        data: scheduleResult,
        message: 'Posts scheduled at optimal times successfully'
      });

    } catch (error) {
      logger.error('Schedule optimal posts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to schedule optimal posts'
      });
    }
  }
);

// ========================================
// AI Caption Generation
// ========================================

/**
 * @route   POST /api/smart-posting/generate-caption
 * @desc    Generate AI-optimized captions for video content
 * @access  Private
 */
router.post('/generate-caption',
  authenticateToken,
  [
    body('videoId')
      .isUUID()
      .withMessage('Valid video ID required'),
    body('platform')
      .isIn(Object.values(SocialPlatform))
      .withMessage('Valid platform required'),
    body('tone')
      .optional()
      .isIn(Object.values(CaptionTone))
      .withMessage('Valid tone required'),
    body('style')
      .optional()
      .isIn(Object.values(CaptionStyle))
      .withMessage('Valid style required'),
    body('includeCallToAction')
      .optional()
      .isBoolean()
      .withMessage('Include CTA must be boolean'),
    body('targetAudience')
      .optional()
      .isString()
      .withMessage('Target audience must be string'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        videoId,
        platform,
        tone = CaptionTone.PROFESSIONAL,
        style = CaptionStyle.STORY,
        includeCallToAction = true,
        targetAudience = 'homebuyers and real estate investors'
      } = req.body;

      const captionResult = await smartPostingService.generateOptimalCaption({
        videoId,
        platform,
        tone,
        style,
        includeCallToAction,
        targetAudience: {
          demographics: [targetAudience],
          interests: ['real estate', 'property investment'],
          behaviorTraits: ['home shopping', 'investment research'],
          preferredTimes: ['morning', 'evening']
        },
        contentContext: {
          targetBuyers: [targetAudience],
          marketConditions: 'stable'
        }
      });

      logger.info(`AI caption generated for video ${videoId} on ${platform}`);

      res.json({
        success: true,
        data: captionResult,
        message: 'AI caption generated successfully'
      });

    } catch (error) {
      logger.error('Generate caption error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate AI caption'
      });
    }
  }
);

/**
 * @route   POST /api/smart-posting/optimize-caption
 * @desc    Optimize existing caption for better performance
 * @access  Private
 */
router.post('/optimize-caption',
  authenticateToken,
  [
    body('caption')
      .isString()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Caption must be between 10 and 2000 characters'),
    body('platform')
      .isIn(Object.values(SocialPlatform))
      .withMessage('Valid platform required'),
    body('targetAudience')
      .optional()
      .isString()
      .withMessage('Target audience must be string'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { caption, platform, targetAudience = 'homebuyers' } = req.body;
      const userId = (req as any).userId;

      const optimizationResult = await smartPostingService.optimizeCaption(caption, {
        platform,
        targetAudience: {
          demographics: [targetAudience],
          interests: ['real estate'],
          behaviorTraits: ['home shopping'],
          preferredTimes: []
        },
        postingTime: new Date(),
        historicalPerformance: {
          averageViews: 1000,
          averageEngagement: 50,
          bestPerformingPosts: [],
          trends: []
        },
        currentTrends: []
      });

      logger.info(`Caption optimized for user ${userId} on ${platform}`);

      res.json({
        success: true,
        data: optimizationResult,
        message: 'Caption optimized successfully'
      });

    } catch (error) {
      logger.error('Optimize caption error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize caption'
      });
    }
  }
);

// ========================================
// Smart Hashtag Generation
// ========================================

/**
 * @route   POST /api/smart-posting/generate-hashtags
 * @desc    Generate optimal hashtag strategy
 * @access  Private
 */
router.post('/generate-hashtags',
  authenticateToken,
  [
    body('content')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Content description required'),
    body('category')
      .isIn(Object.values(VideoCategory))
      .withMessage('Valid video category required'),
    body('platform')
      .isIn(Object.values(SocialPlatform))
      .withMessage('Valid platform required'),
    body('strategy')
      .optional()
      .isIn(Object.values(HashtagStrategyType))
      .withMessage('Valid hashtag strategy required'),
    body('count')
      .optional()
      .isInt({ min: 5, max: 30 })
      .withMessage('Hashtag count must be between 5 and 30'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        content,
        category,
        platform,
        strategy = HashtagStrategyType.BALANCED,
        count = 20
      } = req.body;

      const hashtagResult = await smartPostingService.generateOptimalHashtags({
        content,
        category,
        platform,
        targetAudience: {
          demographics: ['homebuyers', 'investors'],
          interests: ['real estate', 'property'],
          behaviorTraits: ['home shopping'],
          preferredTimes: []
        },
        strategy,
        count,
        avoidOverused: true
      });

      logger.info(`Smart hashtags generated for ${category} content on ${platform}`);

      res.json({
        success: true,
        data: hashtagResult,
        message: 'Smart hashtags generated successfully'
      });

    } catch (error) {
      logger.error('Generate hashtags error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate smart hashtags'
      });
    }
  }
);

/**
 * @route   GET /api/smart-posting/trending-hashtags
 * @desc    Get currently trending hashtags
 * @access  Private
 */
router.get('/trending-hashtags',
  authenticateToken,
  [
    query('platform')
      .isIn(Object.values(SocialPlatform))
      .withMessage('Valid platform required'),
    query('category')
      .optional()
      .isString()
      .withMessage('Category must be string'),
    query('limit')
      .optional()
      .isInt({ min: 5, max: 50 })
      .withMessage('Limit must be between 5 and 50'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { platform, category = 'real-estate', limit = 20 } = req.query;

      const trendingHashtags = await smartPostingService.getTrendingHashtags(
        platform as SocialPlatform,
        category as string,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: trendingHashtags,
        message: 'Trending hashtags retrieved successfully'
      });

    } catch (error) {
      logger.error('Get trending hashtags error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get trending hashtags'
      });
    }
  }
);

// ========================================
// Viral Analysis & Optimization
// ========================================

/**
 * @route   POST /api/smart-posting/analyze-viral-potential
 * @desc    Analyze viral potential of video content
 * @access  Private
 */
router.post('/analyze-viral-potential',
  authenticateToken,
  [
    body('videoId')
      .isUUID()
      .withMessage('Valid video ID required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { videoId } = req.body;

      const viralAnalysis = await smartPostingService.analyzeViralPotential(videoId);

      logger.info(`Viral potential analyzed for video ${videoId}`);

      res.json({
        success: true,
        data: viralAnalysis,
        message: 'Viral potential analyzed successfully'
      });

    } catch (error) {
      logger.error('Analyze viral potential error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze viral potential'
      });
    }
  }
);

/**
 * @route   POST /api/smart-posting/optimize-for-virality
 * @desc    Optimize post for maximum viral potential
 * @access  Private
 */
router.post('/optimize-for-virality',
  authenticateToken,
  [
    body('postId')
      .isUUID()
      .withMessage('Valid post ID required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { postId } = req.body;

      const optimizationResult = await smartPostingService.optimizePostForVirality(postId);

      logger.info(`Post ${postId} optimized for virality`);

      res.json({
        success: true,
        data: optimizationResult,
        message: 'Post optimized for virality successfully'
      });

    } catch (error) {
      logger.error('Optimize for virality error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize for virality'
      });
    }
  }
);

// ========================================
// Real Estate Specific Optimizations
// ========================================

/**
 * @route   POST /api/smart-posting/real-estate-optimize
 * @desc    Real estate specific content optimization
 * @access  Private
 */
router.post('/real-estate-optimize',
  authenticateToken,
  [
    body('content')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Content required'),
    body('propertyDetails')
      .isObject()
      .withMessage('Property details object required'),
    body('marketConditions')
      .optional()
      .isObject()
      .withMessage('Market conditions must be object'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { 
        content, 
        propertyDetails, 
        marketConditions = { trend: 'stable' } 
      } = req.body;

      const optimization = await smartPostingService.optimizeForRealEstate(
        content,
        propertyDetails,
        marketConditions
      );

      logger.info('Real estate content optimized');

      res.json({
        success: true,
        data: optimization,
        message: 'Real estate content optimized successfully'
      });

    } catch (error) {
      logger.error('Real estate optimize error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize real estate content'
      });
    }
  }
);

/**
 * @route   GET /api/smart-posting/performance-insights
 * @desc    Get AI-powered performance insights
 * @access  Private
 */
router.get('/performance-insights',
  authenticateToken,
  [
    query('platform')
      .optional()
      .isIn(Object.values(SocialPlatform))
      .withMessage('Valid platform required'),
    query('timeframe')
      .optional()
      .isIn(['7d', '30d', '90d'])
      .withMessage('Valid timeframe required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { platform, timeframe = '30d' } = req.query;
      const userId = (req as any).userId;

      const insights = await smartPostingService.getPerformanceInsights(
        userId,
        platform as SocialPlatform || undefined,
        timeframe as string
      );

      res.json({
        success: true,
        data: insights,
        message: 'Performance insights retrieved successfully'
      });

    } catch (error) {
      logger.error('Get performance insights error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance insights'
      });
    }
  }
);

// ========================================
// Bulk Operations
// ========================================

/**
 * @route   POST /api/smart-posting/bulk-optimize
 * @desc    Bulk optimize multiple posts
 * @access  Private
 */
router.post('/bulk-optimize',
  authenticateToken,
  [
    body('postIds')
      .isArray({ min: 1, max: 20 })
      .withMessage('Post IDs array required (max 20)'),
    body('optimizationType')
      .isIn(['caption', 'hashtags', 'timing', 'viral'])
      .withMessage('Valid optimization type required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { postIds, optimizationType } = req.body;
      const userId = (req as any).userId;

      const bulkResults = await smartPostingService.bulkOptimize(
        userId,
        postIds,
        optimizationType
      );

      logger.info(`Bulk optimization completed for ${postIds.length} posts`);

      res.json({
        success: true,
        data: bulkResults,
        message: 'Bulk optimization completed successfully'
      });

    } catch (error) {
      logger.error('Bulk optimize error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete bulk optimization'
      });
    }
  }
);

export default router; 