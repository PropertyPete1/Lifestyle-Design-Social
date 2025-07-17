import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { testModeService } from '../services/testModeService';
import { logger } from '../utils/logger';

const router = Router();

// @route   GET /api/test-mode/status
// @desc    Check if test mode is enabled for the authenticated user
// @access  Private
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const isEnabled = await testModeService.isTestModeEnabled(userId);
    const config = await testModeService.getTestModeConfig(userId);
    
    return res.json({
      success: true,
      data: {
        enabled: isEnabled,
        config: config || null
      },
      message: `Test mode is ${isEnabled ? 'enabled' : 'disabled'}`
    });

  } catch (error) {
    logger.error('Test mode status check error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to check test mode status' 
    });
  }
});

// @route   POST /api/test-mode/enable
// @desc    Enable test mode for the authenticated user
// @access  Private
router.post('/enable', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { config } = req.body;
    
    const testConfig = await testModeService.enableTestMode(userId, config);
    
    return res.json({
      success: true,
      data: testConfig,
      message: 'Test mode enabled successfully'
    });

  } catch (error) {
    logger.error('Test mode enable error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to enable test mode' 
    });
  }
});

// @route   POST /api/test-mode/disable
// @desc    Disable test mode for the authenticated user
// @access  Private
router.post('/disable', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    await testModeService.disableTestMode(userId);
    
    return res.json({
      success: true,
      message: 'Test mode disabled successfully'
    });

  } catch (error) {
    logger.error('Test mode disable error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to disable test mode' 
    });
  }
});

// @route   POST /api/test-mode/simulate-post
// @desc    Simulate a post to test account
// @access  Private
router.post('/simulate-post', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, content, mediaPath: _mediaPath } = req.body;
    
    if (!platform || !content) {
      return res.status(400).json({ error: 'Platform and content are required' });
    }

    const testPost = await testModeService.simulatePost(userId, platform, content);
    
    return res.json({
      success: true,
      data: testPost,
      message: `Test post simulated successfully on ${platform}`
    });

  } catch (error) {
    logger.error('Test post simulation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to simulate post' 
    });
  }
});

// @route   GET /api/test-mode/posts
// @desc    Get test posts for the authenticated user
// @access  Private
router.get('/posts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = 50 } = req.query;
    
    const testPosts = await testModeService.getTestPosts(userId, parseInt(limit as string));
    
    return res.json({
      success: true,
      data: {
        posts: testPosts,
        totalPosts: testPosts.length
      },
      message: `Retrieved ${testPosts.length} test posts`
    });

  } catch (error) {
    logger.error('Test posts retrieval error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve test posts' 
    });
  }
});

// @route   DELETE /api/test-mode/posts
// @desc    Clear test post history for the authenticated user
// @access  Private
router.delete('/posts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    await testModeService.clearTestPosts(userId);
    
    return res.json({
      success: true,
      message: 'Test post history cleared successfully'
    });

  } catch (error) {
    logger.error('Test posts clearing error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to clear test posts' 
    });
  }
});

// @route   GET /api/test-mode/analytics
// @desc    Get test mode analytics for the authenticated user
// @access  Private
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const analytics = await testModeService.getTestModeAnalytics(userId);
    
    return res.json({
      success: true,
      data: analytics,
      message: 'Test mode analytics retrieved successfully'
    });

  } catch (error) {
    logger.error('Test mode analytics error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve test mode analytics' 
    });
  }
});

// @route   GET /api/test-mode/account/:platform
// @desc    Get test account for specific platform
// @access  Private
router.get('/account/:platform', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform } = req.params;
    
    if (!platform) {
      return res.status(400).json({ error: 'Platform parameter is required' });
    }
    
    const testAccount = await testModeService.getTestAccount(userId, platform);
    
    if (!testAccount) {
      return res.status(404).json({ 
        success: false, 
        error: `No test account found for platform: ${platform}` 
      });
    }
    
    return res.json({
      success: true,
      data: testAccount,
      message: `Test account retrieved for ${platform}`
    });

  } catch (error) {
    logger.error('Test account retrieval error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve test account' 
    });
  }
});

export default router; 