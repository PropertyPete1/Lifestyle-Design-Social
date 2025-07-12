// ========================================
// Instagram Learning API Routes
// ========================================

import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { InstagramLearningService } from '../services/instagramLearningService';
import { logger } from '../utils/logger';

const router = Router();
const instagramLearningService = new InstagramLearningService();

// ========================================
// Instagram Data Sync & Analysis
// ========================================

/**
 * @route   POST /api/instagram-learning/sync
 * @desc    Sync user's Instagram posts and analyze content
 * @access  Private
 */
router.post('/sync',
  authenticateToken,
  [
    body('postsToFetch')
      .optional()
      .isInt({ min: 10, max: 200 })
      .withMessage('Posts to fetch must be between 10 and 200'),
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

      const { postsToFetch = 50 } = req.body;
      const userId = (req as any).userId;

      // Check if Instagram is connected
      const connection = await instagramLearningService.checkInstagramConnection(userId);
      if (!connection) {
        return res.status(400).json({
          success: false,
          error: 'Instagram account not connected. Please connect your Instagram first.'
        });
      }

      // Start sync process
      await instagramLearningService.syncUserInstagramPosts(userId, postsToFetch);

      logger.info(`Instagram sync completed for user ${userId}`);

      res.json({
        success: true,
        message: `Successfully synced ${postsToFetch} Instagram posts and analyzed your content style`,
        data: {
          postsFetched: postsToFetch,
          nextStep: 'Your personal style has been analyzed. You can now generate personalized captions!'
        }
      });

    } catch (error) {
      logger.error('Instagram sync error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to sync Instagram posts'
      });
    }
  }
);

/**
 * @route   GET /api/instagram-learning/style-analysis
 * @desc    Get user's analyzed writing style and performance insights
 * @access  Private
 */
router.get('/style-analysis',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      const styleAnalysis = await instagramLearningService.getUserStyleAnalysis(userId);
      
      if (!styleAnalysis) {
        return res.status(404).json({
          success: false,
          error: 'Style analysis not found. Please sync your Instagram posts first.',
          action: 'Use POST /api/instagram-learning/sync to analyze your content'
        });
      }

      res.json({
        success: true,
        data: {
          style: styleAnalysis,
          insights: {
            totalPostsAnalyzed: styleAnalysis.totalPosts,
            averagePerformance: styleAnalysis.averagePerformance,
            bestPerformingContent: styleAnalysis.topPerformingThemes,
            writingStrengths: styleAnalysis.engagementTriggers,
            recommendedImprovements: styleAnalysis.recommendations || []
          }
        },
        message: 'Your personal Instagram style has been analyzed successfully'
      });

    } catch (error) {
      logger.error('Get style analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get style analysis'
      });
    }
  }
);

/**
 * @route   GET /api/instagram-learning/posts-performance
 * @desc    Get performance breakdown of user's Instagram posts
 * @access  Private
 */
router.get('/posts-performance',
  authenticateToken,
  [
    query('limit')
      .optional()
      .isInt({ min: 5, max: 100 })
      .withMessage('Limit must be between 5 and 100'),
    query('sortBy')
      .optional()
      .isIn(['performance', 'engagement', 'date'])
      .withMessage('Sort by must be performance, engagement, or date'),
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

      const { limit = 20, sortBy = 'performance' } = req.query;
      const userId = (req as any).userId;

      const postsPerformance = await instagramLearningService.getPostsPerformanceBreakdown(
        userId,
        parseInt(limit as string),
        sortBy as string
      );

      res.json({
        success: true,
        data: postsPerformance,
        message: 'Posts performance data retrieved successfully'
      });

    } catch (error) {
      logger.error('Get posts performance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get posts performance data'
      });
    }
  }
);

// ========================================
// Personalized Caption Generation
// ========================================

/**
 * @route   POST /api/instagram-learning/generate-caption
 * @desc    Generate personalized captions based on user's style
 * @access  Private
 */
router.post('/generate-caption',
  authenticateToken,
  [
    body('contentDescription')
      .isString()
      .isLength({ min: 10, max: 500 })
      .withMessage('Content description must be between 10 and 500 characters'),
    body('targetTone')
      .optional()
      .isIn(['casual', 'professional', 'funny', 'inspirational', 'educational'])
      .withMessage('Target tone must be valid'),
    body('includeHashtags')
      .optional()
      .isBoolean()
      .withMessage('Include hashtags must be boolean'),
    body('captionCount')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Caption count must be between 1 and 10'),
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
        contentDescription,
        targetTone,
        includeHashtags = true,
        captionCount = 5
      } = req.body;
      const userId = (req as any).userId;

      // Generate personalized captions
      const captions = await instagramLearningService.generatePersonalizedCaption(
        userId,
        contentDescription,
        targetTone
      );

      // Generate personalized hashtags if requested
      let hashtags: string[] = [];
      if (includeHashtags) {
        hashtags = await instagramLearningService.generatePersonalizedHashtags(
          userId,
          contentDescription
        );
      }

      logger.info(`Generated ${captions.length} personalized captions for user ${userId}`);

      res.json({
        success: true,
        data: {
          captions: captions.slice(0, captionCount),
          hashtags,
          styleInsights: {
            matchesYourStyle: captions[0]?.styleMatch || 0,
            expectedPerformance: captions[0]?.expectedPerformance || 0,
            basedOnTopPosts: captions[0]?.basedOnPosts?.length || 0
          }
        },
        message: 'Personalized captions generated successfully based on your Instagram style'
      });

    } catch (error) {
      logger.error('Generate personalized caption error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate personalized captions'
      });
    }
  }
);

/**
 * @route   POST /api/instagram-learning/predict-performance
 * @desc    Predict how well a caption will perform based on user's history
 * @access  Private
 */
router.post('/predict-performance',
  authenticateToken,
  [
    body('caption')
      .isString()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Caption must be between 10 and 2000 characters'),
    body('hashtags')
      .optional()
      .isArray()
      .withMessage('Hashtags must be an array'),
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

      const { caption, hashtags = [] } = req.body;
      const userId = (req as any).userId;

      const prediction = await instagramLearningService.predictCaptionPerformance(
        userId,
        caption
      );

      const hashtagAnalysis = hashtags.length > 0 
        ? await instagramLearningService.analyzeHashtagPotential(userId, hashtags)
        : null;

      res.json({
        success: true,
        data: {
          prediction,
          hashtagAnalysis,
          recommendations: prediction.score < 6 ? [
            'Consider adding more emotional triggers',
            'Include a clear call-to-action',
            'Match your successful post patterns more closely'
          ] : [
            'Great caption! This matches your successful style',
            'Consider posting at your optimal times for best results'
          ]
        },
        message: 'Performance prediction completed successfully'
      });

    } catch (error) {
      logger.error('Predict performance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to predict caption performance'
      });
    }
  }
);

// ========================================
// Hashtag Analysis & Optimization
// ========================================

/**
 * @route   GET /api/instagram-learning/hashtag-analysis
 * @desc    Get user's hashtag performance analysis
 * @access  Private
 */
router.get('/hashtag-analysis',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      const hashtagAnalysis = await instagramLearningService.getUserHashtagAnalysis(userId);

      res.json({
        success: true,
        data: {
          topPerforming: hashtagAnalysis.topPerforming.slice(0, 20),
          underperforming: hashtagAnalysis.underperforming.slice(0, 10),
          overused: hashtagAnalysis.overused,
          recommendations: hashtagAnalysis.recommendations,
          insights: {
            totalHashtagsUsed: hashtagAnalysis.totalHashtags,
            averagePerformance: hashtagAnalysis.averagePerformance,
            bestStrategy: hashtagAnalysis.bestStrategy
          }
        },
        message: 'Hashtag performance analysis retrieved successfully'
      });

    } catch (error) {
      logger.error('Get hashtag analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get hashtag analysis'
      });
    }
  }
);

/**
 * @route   POST /api/instagram-learning/optimize-hashtags
 * @desc    Get optimized hashtag suggestions for specific content
 * @access  Private
 */
router.post('/optimize-hashtags',
  authenticateToken,
  [
    body('contentDescription')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Content description required'),
    body('targetReach')
      .optional()
      .isIn(['high', 'medium', 'niche'])
      .withMessage('Target reach must be high, medium, or niche'),
    body('avoidOverused')
      .optional()
      .isBoolean()
      .withMessage('Avoid overused must be boolean'),
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
        contentDescription,
        targetReach = 'medium',
        avoidOverused = true
      } = req.body;
      const userId = (req as any).userId;

      const optimizedHashtags = await instagramLearningService.generatePersonalizedHashtags(
        userId,
        contentDescription,
        targetReach
      );

      const hashtagBreakdown = await instagramLearningService.analyzeHashtagMix(optimizedHashtags);

      res.json({
        success: true,
        data: {
          hashtags: optimizedHashtags,
          breakdown: hashtagBreakdown,
          strategy: {
            personalBest: hashtagBreakdown.personalBest,
            trending: hashtagBreakdown.trending,
            contentSpecific: hashtagBreakdown.contentSpecific,
            niche: hashtagBreakdown.niche
          },
          expectedReach: hashtagBreakdown.expectedTotalReach
        },
        message: 'Optimized hashtags generated based on your performance data'
      });

    } catch (error) {
      logger.error('Optimize hashtags error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize hashtags'
      });
    }
  }
);

// ========================================
// Content Approval System
// ========================================

/**
 * @route   POST /api/instagram-learning/submit-for-approval
 * @desc    Submit content for manual approval before posting
 * @access  Private
 */
router.post('/submit-for-approval',
  authenticateToken,
  [
    body('caption')
      .isString()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Caption must be between 10 and 2000 characters'),
    body('hashtags')
      .isArray()
      .withMessage('Hashtags array required'),
    body('scheduledTime')
      .isISO8601()
      .withMessage('Valid scheduled time required'),
    body('videoId')
      .optional()
      .isUUID()
      .withMessage('Video ID must be valid UUID'),
    body('platform')
      .isIn(['instagram', 'tiktok', 'facebook'])
      .withMessage('Valid platform required'),
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
        caption,
        hashtags,
        scheduledTime,
        videoId,
        platform
      } = req.body;
      const userId = (req as any).userId;

      // Get performance prediction
      const prediction = await instagramLearningService.predictCaptionPerformance(userId, caption);

      // Submit for approval
      const approvalId = await instagramLearningService.submitForApproval(
        userId,
        caption,
        hashtags,
        new Date(scheduledTime),
        videoId
      );

      logger.info(`Content submitted for approval: ${approvalId}`);

      res.json({
        success: true,
        data: {
          approvalId,
          prediction,
          status: 'pending_approval',
          estimatedReview: '5-10 minutes',
          canEditUntil: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        },
        message: 'Content submitted for approval successfully. You will be notified when reviewed.'
      });

    } catch (error) {
      logger.error('Submit for approval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit content for approval'
      });
    }
  }
);

/**
 * @route   GET /api/instagram-learning/pending-approvals
 * @desc    Get all pending approval requests for user
 * @access  Private
 */
router.get('/pending-approvals',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      const pendingApprovals = await instagramLearningService.getPendingApprovals(userId);

      res.json({
        success: true,
        data: pendingApprovals,
        message: 'Pending approvals retrieved successfully'
      });

    } catch (error) {
      logger.error('Get pending approvals error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get pending approvals'
      });
    }
  }
);

/**
 * @route   POST /api/instagram-learning/approve/:approvalId
 * @desc    Approve or reject a pending post
 * @access  Private
 */
router.post('/approve/:approvalId',
  authenticateToken,
  [
    param('approvalId')
      .isUUID()
      .withMessage('Valid approval ID required'),
    body('approved')
      .isBoolean()
      .withMessage('Approved status must be boolean'),
    body('feedback')
      .optional()
      .isString()
      .withMessage('Feedback must be string'),
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

      const { approvalId } = req.params;
      const { approved, feedback } = req.body;
      const userId = (req as any).userId;

      // Verify ownership
      const approval = await instagramLearningService.getApprovalRequest(approvalId);
      if (approval.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to approve this content'
        });
      }

      await instagramLearningService.approvePost(approvalId, approved, feedback);

      logger.info(`Approval ${approvalId} ${approved ? 'approved' : 'rejected'} by user ${userId}`);

      res.json({
        success: true,
        data: {
          approvalId,
          status: approved ? 'approved' : 'rejected',
          nextAction: approved ? 'Content will be posted at scheduled time' : 'Content has been cancelled'
        },
        message: `Content ${approved ? 'approved' : 'rejected'} successfully`
      });

    } catch (error) {
      logger.error('Approve post error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process approval'
      });
    }
  }
);

// ========================================
// Learning Insights & Reports
// ========================================

/**
 * @route   GET /api/instagram-learning/insights-report
 * @desc    Get comprehensive learning insights and recommendations
 * @access  Private
 */
router.get('/insights-report',
  authenticateToken,
  [
    query('timeframe')
      .optional()
      .isIn(['7d', '30d', '90d', 'all'])
      .withMessage('Timeframe must be 7d, 30d, 90d, or all'),
  ],
  async (req: Request, res: Response) => {
    try {
      const { timeframe = '30d' } = req.query;
      const userId = (req as any).userId;

      const insightsReport = await instagramLearningService.generateInsightsReport(
        userId,
        timeframe as string
      );

      res.json({
        success: true,
        data: insightsReport,
        message: 'Learning insights report generated successfully'
      });

    } catch (error) {
      logger.error('Get insights report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate insights report'
      });
    }
  }
);

/**
 * @route   POST /api/instagram-learning/update-style
 * @desc    Force update user's style analysis with latest posts
 * @access  Private
 */
router.post('/update-style',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      const updatedStyle = await instagramLearningService.analyzeUserStyle(userId);

      res.json({
        success: true,
        data: updatedStyle,
        message: 'Style analysis updated successfully with latest content'
      });

    } catch (error) {
      logger.error('Update style error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update style analysis'
      });
    }
  }
);

export default router; 