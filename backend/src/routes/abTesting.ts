import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { abTestingService } from '../services/abTestingService';
import { logger } from '../utils/logger';

const router = Router();

// @route   POST /api/ab-testing/create
// @desc    Create a new A/B test
// @access  Private
router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const config = req.body;

    if (!config.name || !config.testType || !config.variants) {
      return res.status(400).json({ error: 'Name, testType, and variants are required' });
    }

    const abTest = await abTestingService.createABTest(userId, config);

    return res.json({
      success: true,
      data: abTest,
      message: 'A/B test created successfully'
    });

  } catch (error) {
    logger.error('A/B test creation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create A/B test' 
    });
  }
});

// @route   GET /api/ab-testing/tests
// @desc    Get all A/B tests for the authenticated user
// @access  Private
router.get('/tests', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status } = req.query;

    const tests = await abTestingService.getUserABTests(userId, status as any);

    return res.json({
      success: true,
      data: {
        tests,
        totalTests: tests.length
      },
      message: `Retrieved ${tests.length} A/B tests`
    });

  } catch (error) {
    logger.error('A/B tests retrieval error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve A/B tests' 
    });
  }
});

// @route   GET /api/ab-testing/test/:testId
// @desc    Get specific A/B test details
// @access  Private
router.get('/test/:testId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({ error: 'Test ID is required' });
    }

    const test = await abTestingService.getABTest(testId);

    if (!test) {
      return res.status(404).json({ 
        success: false, 
        error: 'A/B test not found' 
      });
    }

    return res.json({
      success: true,
      data: test,
      message: 'A/B test retrieved successfully'
    });

  } catch (error) {
    logger.error('A/B test retrieval error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve A/B test' 
    });
  }
});

// @route   POST /api/ab-testing/test/:testId/pause
// @desc    Pause an A/B test
// @access  Private
router.post('/test/:testId/pause', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({ error: 'Test ID is required' });
    }

    await abTestingService.pauseABTest(testId);

    return res.json({
      success: true,
      message: 'A/B test paused successfully'
    });

  } catch (error) {
    logger.error('A/B test pause error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to pause A/B test' 
    });
  }
});

// @route   POST /api/ab-testing/test/:testId/resume
// @desc    Resume an A/B test
// @access  Private
router.post('/test/:testId/resume', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({ error: 'Test ID is required' });
    }

    await abTestingService.resumeABTest(testId);

    return res.json({
      success: true,
      message: 'A/B test resumed successfully'
    });

  } catch (error) {
    logger.error('A/B test resume error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to resume A/B test' 
    });
  }
});

// @route   POST /api/ab-testing/test/:testId/complete
// @desc    Complete an A/B test and analyze results
// @access  Private
router.post('/test/:testId/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({ error: 'Test ID is required' });
    }

    const completedTest = await abTestingService.completeABTest(testId);

    return res.json({
      success: true,
      data: completedTest,
      message: 'A/B test completed and analyzed successfully'
    });

  } catch (error) {
    logger.error('A/B test completion error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to complete A/B test' 
    });
  }
});

// @route   POST /api/ab-testing/record-result
// @desc    Record post result for A/B test
// @access  Private
router.post('/record-result', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { testId, variantId, postId, metrics } = req.body;

    if (!testId || !variantId || !postId || !metrics) {
      return res.status(400).json({ error: 'testId, variantId, postId, and metrics are required' });
    }

    await abTestingService.recordPostResult(testId, variantId, postId, metrics);

    return res.json({
      success: true,
      message: 'Post result recorded successfully'
    });

  } catch (error) {
    logger.error('Post result recording error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to record post result' 
    });
  }
});

// @route   GET /api/ab-testing/variant-for-post
// @desc    Get variant for new post
// @access  Private
router.get('/variant-for-post', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, testType } = req.query;

    if (!platform || !testType) {
      return res.status(400).json({ error: 'Platform and testType are required' });
    }

    const variant = await abTestingService.getVariantForPost(
      platform as string, 
      userId
    );

    return res.json({
      success: true,
      data: variant,
      message: variant ? 'Variant selected for post' : 'No active A/B test found'
    });

  } catch (error) {
    logger.error('Variant selection error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get variant for post' 
    });
  }
});

// @route   POST /api/ab-testing/generate-caption-variations
// @desc    Generate caption variations for A/B testing
// @access  Private
router.post('/generate-caption-variations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { originalCaption, variationCount = 3 } = req.body;

    if (!originalCaption) {
      return res.status(400).json({ error: 'Original caption is required' });
    }

    const variations = await abTestingService.generateCaptionVariations(
      originalCaption, 
      variationCount
    );

    return res.json({
      success: true,
      data: {
        originalCaption,
        variations,
        totalVariations: variations.length
      },
      message: `Generated ${variations.length} caption variations`
    });

  } catch (error) {
    logger.error('Caption variation generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate caption variations' 
    });
  }
});

// @route   GET /api/ab-testing/analytics
// @desc    Get A/B testing analytics overview
// @access  Private
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [activeTests, completedTests, allTests] = await Promise.all([
      abTestingService.getUserABTests(userId, 'active'),
      abTestingService.getUserABTests(userId, 'completed'),
      abTestingService.getUserABTests(userId)
    ]);

    // Calculate summary statistics
    const totalTests = allTests.length;
    const activeCount = activeTests.length;
    const completedCount = completedTests.length;
    
    const significantWins = completedTests.filter(test => 
      test.results?.significance && (test.results.improvementPercent || 0) > 0
    ).length;

    const averageImprovement = completedTests.length > 0 
      ? completedTests.reduce((sum, test) => 
          sum + (test.results?.improvementPercent || 0), 0
        ) / completedTests.length
      : 0;

    const testTypeBreakdown = allTests.reduce((acc, test) => {
      acc[test.testType] = (acc[test.testType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return res.json({
      success: true,
      data: {
        summary: {
          totalTests,
          activeTests: activeCount,
          completedTests: completedCount,
          significantWins,
          winRate: completedCount > 0 ? Math.round((significantWins / completedCount) * 100) : 0,
          averageImprovement: Math.round(averageImprovement * 100) / 100
        },
        testTypeBreakdown,
        recentTests: allTests.slice(0, 10) // Last 10 tests
      },
      message: 'A/B testing analytics retrieved successfully'
    });

  } catch (error) {
    logger.error('A/B testing analytics error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve A/B testing analytics' 
    });
  }
});

export default router; 