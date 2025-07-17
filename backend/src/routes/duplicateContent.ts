import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { duplicateContentService } from '../services/duplicateContentService';
import { Post } from '../models/Post';
import { connectToDatabase } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// @route   POST /api/duplicate-content/check
// @desc    Check if caption is too similar to recent posts
// @access  Private
router.post('/check', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { caption, platform, timeframeDays, similarityThreshold } = req.body;

    if (!caption) {
      return res.status(400).json({ error: 'Caption is required' });
    }

    const result = await duplicateContentService.checkCaptionSimilarity({
      userId,
      newCaption: caption,
      platform,
      timeframeDays,
      similarityThreshold
    });

    logger.info(`Duplicate check for user ${userId}: ${result.similarity * 100}% similar`);

    return res.json({
      success: true,
      data: {
        isSimilar: result.isSimilar,
        similarity: Math.round(result.similarity * 100),
        matchedCaption: result.matchedCaption,
        recommendation: result.recommendation,
        threshold: (similarityThreshold || 0.7) * 100
      },
      message: result.isSimilar 
        ? 'Caption is too similar to recent posts'
        : 'Caption is unique and ready to use'
    });

  } catch (error) {
    logger.error('Duplicate content check error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to check duplicate content' 
    });
  }
});

// @route   POST /api/duplicate-content/regenerate
// @desc    Auto-regenerate caption if too similar
// @access  Private
router.post('/regenerate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { caption, platform, timeframeDays, similarityThreshold } = req.body;

    if (!caption) {
      return res.status(400).json({ error: 'Caption is required' });
    }

    const result = await duplicateContentService.regenerateCaptionIfSimilar({
      userId,
      originalCaption: caption,
      videoType: 'real_estate', // Default to real_estate, could be made configurable
      platform,
      timeframeDays,
      similarityThreshold
    });

    logger.info(`Caption regeneration for user ${userId}: regenerated: ${result.regenerated}`);

    return res.json({
      success: true,
      data: {
        finalCaption: result.newCaption || caption,
        wasRegenerated: result.regenerated,
        originalCaption: caption
      },
      message: result.regenerated 
        ? `Caption regenerated to ensure uniqueness`
        : 'Original caption was already unique'
    });

  } catch (error) {
    logger.error('Caption regeneration error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to regenerate caption' 
    });
  }
});

// @route   GET /api/duplicate-content/stats/:userId
// @desc    Get duplicate content statistics for user
// @access  Private
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { timeframeDays = '60' } = req.query;

    // Get basic stats from database
    await connectToDatabase();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframeDays as string, 10));
    
    const posts = await Post.find({
      userId,
      createdAt: { $gte: cutoffDate },
      content: { $exists: true, $ne: '' }
    });
    
    const totalPosts = posts.length;
    const uniqueCaptions = new Set(posts.map(p => p.content)).size;
    const avgCaptionLength = totalPosts > 0 ? 
      posts.reduce((sum, p) => sum + p.content.length, 0) / totalPosts : 0;
    
    const stats = { totalPosts, uniqueCaptions, avgCaptionLength: Math.round(avgCaptionLength) };

    const duplicateRisk = stats.totalPosts > 0 
      ? Math.round((1 - (stats.uniqueCaptions / stats.totalPosts)) * 100)
      : 0;

    return res.json({
      success: true,
      data: {
        totalPosts: stats.totalPosts,
        uniqueCaptions: stats.uniqueCaptions,
        duplicateRisk: duplicateRisk,
        avgCaptionLength: Math.round(stats.avgCaptionLength || 0),
        timeframeDays: parseInt(timeframeDays as string),
        recommendations: duplicateRisk > 30 
          ? ['Consider more diverse caption templates', 'Vary your writing style more']
          : ['Good content diversity!', 'Keep up the varied approach']
      },
      message: `Analyzed ${stats.totalPosts} posts from the last ${timeframeDays} days`
    });

  } catch (error) {
    logger.error('Duplicate content stats error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get duplicate content statistics' 
    });
  }
});

export default router; 