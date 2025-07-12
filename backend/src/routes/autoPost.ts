import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AutoPostingService } from '../services/autoPostingService';
import { VideoModel } from '../models/Video';
import { PostModel } from '../models/Post';
import jwt from 'jsonwebtoken';
// import { authenticateToken } from '../middleware/auth'; // Remove this, use local definition
import SchedulerService from '../services/schedulerService';
import { User } from '../models/User';
import CameraRollService from '../services/cameraRollService';
import CartoonService from '../services/cartoonService';
// TODO: Import cameraRollService, videoMatchingService, cartoonService, etc. as needed

const router = Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware (copied from videos.ts)
// const authenticateToken = (req: Request, res: Response, next: Function) => {
//   const token = req.headers.authorization?.replace('Bearer ', '');
//   if (!token) {
//     return res.status(401).json({ error: 'No token provided' });
//   }
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
//     (req as any).userId = decoded.userId;
//     next();
//   } catch (error) {
//     return res.status(401).json({ error: 'Invalid token' });
//   }
// };

const cameraRollService = new CameraRollService();
const cartoonService = new CartoonService();

// @route   POST /api/autopost/scan-camera-roll
// @desc    Scan camera roll and AI-select best videos for buyer audience
// @access  Private
router.post('/scan-camera-roll', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { targetCount = 3 } = req.body;
    const userId = (req as any).userId;
    const allVideos = await cameraRollService.scanCameraRoll(userId);
    const selectedVideos = await cameraRollService.aiSelectBestVideos(allVideos, targetCount);
    res.json({
      message: `Successfully selected ${selectedVideos.length} videos for auto-posting`,
      videos: selectedVideos.map(video => ({
        name: video.name,
        duration: video.duration,
        size: video.size,
        resolution: `${video.width}x${video.height}`,
        aiScore: video.aiScore,
        hasAudio: video.hasAudio
      }))
    });
  } catch (error: any) {
    console.error('Camera roll scan error:', error);
    res.status(500).json({ error: 'Failed to scan camera roll', details: error.message });
  }
});

// @route   POST /api/autopost/enable
// @desc    Enable auto-posting for user
// @access  Private
router.post('/enable', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { cameraRollPath, postingTimes } = req.body;
    // TODO: Implement User.updateAutoPostingSettings in TS
    // await User.updateAutoPostingSettings(req.user.userId, { ... })
    res.json({
      message: 'Auto-posting enabled successfully',
      settings: {
        enabled: true,
        cameraRollPath: cameraRollPath || process.env.CAMERA_ROLL_PATH,
        postingTimes: postingTimes || ['09:00', '12:00', '18:00']
      }
    });
  } catch (error: any) {
    console.error('Enable auto-posting error:', error);
    res.status(500).json({ error: 'Failed to enable auto-posting' });
  }
});

// @route   POST /api/autopost/disable
// @desc    Disable auto-posting for user
// @access  Private
router.post('/disable', authenticateToken, async (req: Request, res: Response) => {
  try {
    // TODO: Implement User.updateAutoPostingSettings in TS
    res.json({
      message: 'Auto-posting disabled successfully',
      settings: { enabled: false }
    });
  } catch (error: any) {
    console.error('Disable auto-posting error:', error);
    res.status(500).json({ error: 'Failed to disable auto-posting' });
  }
});

// @route   GET /api/autopost/status
// @desc    Get auto-posting status and settings
// @access  Private
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    // TODO: Implement User.findById and return autoposting settings
    res.json({
      enabled: false, // Placeholder
      cameraRollPath: process.env.CAMERA_ROLL_PATH,
      postingTimes: ['09:00', '12:00', '18:00'],
      nextPostTime: 'Auto-posting disabled'
    });
  } catch (error: any) {
    console.error('Get auto-posting status error:', error);
    res.status(500).json({ error: 'Failed to get auto-posting status' });
  }
});

// @route   POST /api/autopost/test-scan
// @desc    Test scan camera roll without creating video records
// @access  Private
router.post('/test-scan', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const allVideos = await cameraRollService.scanCameraRoll(userId);
    const selectedVideos = await cameraRollService.aiSelectBestVideos(allVideos, 5);
    res.json({
      message: `Found ${allVideos.length} total videos, ${selectedVideos.length} selected for posting`,
      totalVideos: allVideos.length,
      selectedVideos: selectedVideos.map(video => ({
        name: video.name,
        duration: video.duration,
        size: (video.size / 1024 / 1024).toFixed(2) + ' MB',
        resolution: `${video.width}x${video.height}`,
        aiScore: video.aiScore,
        hasAudio: video.hasAudio
      }))
    });
  } catch (error: any) {
    console.error('Test scan error:', error);
    res.status(500).json({ error: 'Failed to test scan camera roll', details: error.message });
  }
});

// @route   GET /api/autopost/next-video
router.get('/next-video', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Return a stub video object
    res.json({
      video: {
        id: 'stub-video-1',
        title: 'Sample Real Estate Video',
        description: 'A beautiful home tour.',
        duration: 60,
        postCount: 2,
        lastPosted: new Date().toISOString(),
        fileName: 'video1.mp4'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get next video' });
  }
});

// @route   POST /api/autopost/mark-video-posted
router.post('/mark-video-posted', authenticateToken, async (req: Request, res: Response) => {
  try {
    // TODO: Implement VideoModel.markVideoAsPosted in TS
    res.json({
      message: 'Video marked as posted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark video as posted' });
  }
});

// @route   GET /api/autopost/video-stats
router.get('/video-stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Return stub stats
    res.json({
      stats: {
        totalVideos: 2,
        totalPosts: 5,
        avgPostsPerVideo: 2.5,
        unpostedVideos: 1,
        readyToRepost: 1
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get video stats' });
  }
});

// @route   GET /api/autopost/instagram-status
router.get('/instagram-status', authenticateToken, async (req: Request, res: Response) => {
  try {
    // TODO: Implement instagramService.validateCredentials in TS
    res.json({
      connected: false, // Placeholder
      setupInstructions: {
        step1: 'Connect your Instagram account to a Facebook Page',
        step2: 'Convert your Instagram account to a Business/Creator account',
        step3: 'Ensure your Facebook Page has the Instagram account connected',
        step4: 'The system will automatically detect the connection'
      },
      note: 'Instagram posting is optional - videos and cartoons will still be created and saved for manual posting'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get Instagram status' });
  }
});

// @route   POST /api/autopost/create-cartoon
router.post('/create-cartoon', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const cartoon = await cartoonService.createCompleteCartoon(userId);
    res.json({
      message: 'Cartoon created successfully',
      cartoon
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create cartoon' });
  }
});

// @route   GET /api/autopost/cartoon-stats
router.get('/cartoon-stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const stats = cartoonService.getCartoonStats();
    res.json({
      ...stats,
      message: `Created ${stats.totalCartoons} cartoons total`
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get cartoon stats' });
  }
});

// @route   GET /api/autopost/cartoons
router.get('/cartoons', authenticateToken, async (req: Request, res: Response) => {
  try {
    // List stubbed cartoon files
    res.json({ cartoons: [{ fileName: 'sample.mp4', url: '/api/autopost/cartoons/download/sample.mp4' }] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list cartoon videos' });
  }
});

// @route   GET /api/autopost/cartoons/download/:fileName
router.get('/cartoons/download/:fileName', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Always return 404 for now (stub)
    res.status(404).json({ error: 'File not found' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to download cartoon video' });
  }
});

export default router; 