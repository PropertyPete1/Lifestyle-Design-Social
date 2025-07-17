import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { autoPostingService } from '../services/autoPostingService';
import { CartoonService } from '../services/cartoonService';
import { User } from '../models/User';
import { Video } from '../models/Video';
import { Post } from '../models/Post';
import { connectToDatabase } from '../config/database';

const router = Router();

// @route   GET /api/autopost/status
// @desc    Get auto-posting status for user
// @access  Private
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;
    
    // Get user settings from database
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate next post time
    const postingTimes = user.postingTimes || ['09:00', '13:00', '18:00'];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    let nextPostTime = 'Not scheduled';
    for (const time of postingTimes) {
      const [hours, minutes] = time.split(':');
      const postTime = new Date(`${today}T${hours}:${minutes}:00`);
      if (postTime > now) {
        nextPostTime = postTime.toLocaleString();
        break;
      }
    }

    return res.json({
      enabled: user.autoPostingEnabled || false,
      postingTimes: postingTimes,
      nextPostTime: nextPostTime,
      timezone: user.timezone || 'UTC'
    });
  } catch (error) {
    logger.error('Get auto-posting status error:', error);
    return res.status(500).json({ error: 'Failed to get auto-posting status' });
  }
});

// @route   POST /api/autopost/enable
// @desc    Enable auto-posting for user
// @access  Private
router.post('/enable', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;
    const { postingTimes } = req.body;

    await User.findByIdAndUpdate(userId, {
      autoPostingEnabled: true,
      postingTimes: postingTimes || ['09:00', '13:00', '18:00']
    });

    logger.info(`Auto-posting enabled for user ${userId}`);
    return res.json({ message: 'Auto-posting enabled successfully' });
  } catch (error) {
    logger.error('Enable auto-posting error:', error);
    return res.status(500).json({ error: 'Failed to enable auto-posting' });
  }
});

// @route   POST /api/autopost/disable
// @desc    Disable auto-posting for user
// @access  Private
router.post('/disable', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;

    await User.findByIdAndUpdate(userId, {
      autoPostingEnabled: false
    });

    logger.info(`Auto-posting disabled for user ${userId}`);
    return res.json({ message: 'Auto-posting disabled successfully' });
  } catch (error) {
    logger.error('Disable auto-posting error:', error);
    return res.status(500).json({ error: 'Failed to disable auto-posting' });
  }
});

// @route   POST /api/autopost/manual-post
// @desc    Manually trigger a post
// @access  Private
router.post('/manual-post', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;
    
    const result = await autoPostingService.manualPost(userId);
    
    return res.json({
      success: true,
      message: 'Manual post triggered successfully',
      result
    });
  } catch (error) {
    logger.error('Manual post error:', error);
    return res.status(500).json({ error: 'Failed to trigger manual post' });
  }
});

// @route   GET /api/autopost/video-stats
// @desc    Get video statistics
// @access  Private
router.get('/video-stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;
    
    const totalVideos = await Video.countDocuments({ userId, isActive: true });
    const totalPosts = await Post.countDocuments({ userId });
    const unpostedVideos = await Video.countDocuments({ userId, isActive: true, postCount: 0 });
    
    // Videos ready to repost (cool-off period passed)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const readyToRepost = await Video.countDocuments({
      userId,
      isActive: true,
      lastPostedAt: { $lt: sevenDaysAgo }
    });

    return res.json({
      stats: {
        totalVideos,
        totalPosts,
        avgPostsPerVideo: totalVideos > 0 ? (totalPosts / totalVideos) : 0,
        unpostedVideos,
        readyToRepost
      }
    });
  } catch (error) {
    logger.error('Get video stats error:', error);
    return res.status(500).json({ error: 'Failed to get video stats' });
  }
});

// @route   GET /api/autopost/next-video
// @desc    Get next video to be posted
// @access  Private
router.get('/next-video', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;
    
    // Get next video for posting (prefer starred videos, then by post count)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const video = await Video.findOne({
      userId,
      isActive: true,
      $or: [
        { lastPostedAt: null },
        { lastPostedAt: { $lt: sevenDaysAgo } }
      ]
    }).sort({ starred: -1, postCount: 1 });

    if (!video) {
      return res.json({ video: null, message: 'No videos available for posting' });
    }

    return res.json({
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        duration: video.duration,
        postCount: video.postCount,
        lastPosted: video.lastPostedAt,
        category: video.category
      }
    });
  } catch (error) {
    logger.error('Get next video error:', error);
    return res.status(500).json({ error: 'Failed to get next video' });
  }
});

// @route   GET /api/autopost/settings
// @desc    Get auto-posting settings
// @access  Private
router.get('/settings', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      isAutoPostingEnabled: user.autoPostingEnabled || false,
      postingTimes: user.postingTimes || ['09:00', '13:00', '18:00'],
      timezone: user.timezone || 'UTC',
      testMode: user.testMode || false
    });
  } catch (error) {
    logger.error('Get auto-post settings error:', error);
    return res.status(500).json({ error: 'Failed to get settings' });
  }
});

// @route   PUT /api/autopost/settings
// @desc    Update auto-posting settings
// @access  Private
router.put('/settings', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;
    const {
      isAutoPostingEnabled,
      postingTimes,
      timezone,
      testMode
    } = req.body;

    await User.findByIdAndUpdate(userId, {
      autoPostingEnabled: isAutoPostingEnabled,
      postingTimes: postingTimes || ['09:00', '13:00', '18:00'],
      timezone: timezone || 'UTC',
      testMode: testMode || false
    });

    logger.info(`Auto-posting settings updated for user ${userId}`);
    return res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    logger.error('Update auto-post settings error:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Initialize cartoon service
const cartoonService = new CartoonService();

// @route   POST /api/autopost/create-cartoon
// @desc    Create a new cartoon
// @access  Private
router.post('/create-cartoon', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;
    
    const cartoon = await cartoonService.createCompleteCartoon(userId);
    
    return res.json({
      success: true,
      cartoon: {
        title: cartoon.script.title,
        duration: cartoon.script.duration,
        videoPath: cartoon.video.path,
        caption: cartoon.caption,
        hashtags: cartoon.hashtags
      },
      message: 'Cartoon created successfully'
    });
  } catch (error) {
    logger.error('Create cartoon error:', error);
    return res.status(500).json({ error: 'Failed to create cartoon' });
  }
});

// @route   POST /api/autopost/create-sample-cartoon
// @desc    Create a sample cartoon (same as create-cartoon for demo)
// @access  Public (for demo purposes)
router.post('/create-sample-cartoon', async (_req: Request, res: Response) => {
  try {
    const cartoon = await cartoonService.createCompleteCartoon('demo-user');
    
    return res.json({
      success: true,
      cartoon: {
        title: cartoon.script.title,
        duration: cartoon.script.duration,
        path: cartoon.video.path,
        caption: cartoon.caption,
        hashtags: cartoon.hashtags
      },
      message: 'Sample cartoon created successfully'
    });
  } catch (error) {
    logger.error('Create sample cartoon error:', error);
    return res.status(500).json({ error: 'Failed to create sample cartoon' });
  }
});

// @route   GET /api/autopost/cartoon-stats
// @desc    Get cartoon statistics
// @access  Public (for demo purposes)
router.get('/cartoon-stats', async (_req: Request, res: Response) => {
  try {
    const stats = await cartoonService.getCartoonStats();
    
    return res.json({
      success: true,
      stats,
      message: 'Cartoon stats retrieved successfully'
    });
  } catch (error) {
    logger.error('Get cartoon stats error:', error);
    return res.status(500).json({ error: 'Failed to get cartoon stats' });
  }
});

// @route   GET /api/autopost/cartoons
// @desc    Get all cartoons
// @access  Public (for demo purposes)
router.get('/cartoons', async (_req: Request, res: Response) => {
  try {
    const cartoons = await cartoonService.listCartoons();
    
    return res.json({
      success: true,
      cartoons: cartoons.map(filename => ({ fileName: filename, filename })),
      message: 'Cartoons retrieved successfully'
    });
  } catch (error) {
    logger.error('Get cartoons error:', error);
    return res.status(500).json({ error: 'Failed to get cartoons' });
  }
});

// @route   GET /api/autopost/cartoons/download/:filename
// @desc    Download cartoon file
// @access  Public (for demo purposes)
router.get('/cartoons/download/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    const cartoonPath = path.join(process.cwd(), 'cartoons', filename);
    
    // Check if file exists
    if (!fs.existsSync(cartoonPath)) {
      return res.status(404).json({ error: 'Cartoon file not found' });
    }
    
    // Set appropriate headers for video download
    const stat = fs.statSync(cartoonPath);
    const fileSize = stat.size;
    
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', fileSize.toString());
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(cartoonPath);
    fileStream.pipe(res);
    
    logger.info(`Downloaded cartoon: ${filename}`);
    return;
  } catch (error) {
    logger.error('Download cartoon error:', error);
    return res.status(500).json({ error: 'Failed to download cartoon' });
  }
});

export default router; 