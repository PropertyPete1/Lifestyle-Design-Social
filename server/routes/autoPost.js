const express = require('express');
const auth = require('../middleware/auth');
const cameraRollService = require('../services/cameraRollService');
const schedulerService = require('../services/schedulerService');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// @route   POST /api/autopost/scan-camera-roll
// @desc    Scan camera roll and AI-select best videos for buyer audience
// @access  Private
router.post('/scan-camera-roll', auth, async (req, res) => {
  try {
    const { targetCount = 3 } = req.body;
    
    console.log(`📱 Scanning camera roll for user: ${req.user.userId}`);
    
    // Scan and select videos
    const selectedVideos = await cameraRollService.autoSelectAndPrepareVideos(
      req.user.userId, 
      targetCount
    );
    
    res.json({
      message: `Successfully selected ${selectedVideos.length} videos for auto-posting`,
      videos: selectedVideos.map(video => ({
        id: video._id,
        title: video.title,
        fileName: video.fileName,
        duration: video.metadata?.duration,
        aiScore: video.metadata?.aiScore,
        status: video.status
      }))
    });
  } catch (error) {
    console.error('Camera roll scan error:', error);
    res.status(500).json({ 
      error: 'Failed to scan camera roll',
      details: error.message 
    });
  }
});

// @route   POST /api/autopost/enable
// @desc    Enable auto-posting for user
// @access  Private
router.post('/enable', auth, async (req, res) => {
  try {
    const { cameraRollPath, postingTimes } = req.body;
    // Update user settings using the correct SQLite method
    await User.updateAutoPostingSettings(req.user.userId, {
      autoPostingEnabled: true,
      cameraRollPath: cameraRollPath || process.env.CAMERA_ROLL_PATH,
      postingTimes: postingTimes || ['09:00', '12:00', '18:00']
    });
    res.json({
      message: 'Auto-posting enabled successfully',
      settings: {
        enabled: true,
        cameraRollPath: cameraRollPath || process.env.CAMERA_ROLL_PATH,
        postingTimes: postingTimes || ['09:00', '12:00', '18:00']
      }
    });
  } catch (error) {
    console.error('Enable auto-posting error:', error);
    res.status(500).json({ error: 'Failed to enable auto-posting' });
  }
});

// @route   POST /api/autopost/disable
// @desc    Disable auto-posting for user
// @access  Private
router.post('/disable', auth, async (req, res) => {
  try {
    await User.updateAutoPostingSettings(req.user.userId, {
      autoPostingEnabled: false
    });
    res.json({
      message: 'Auto-posting disabled successfully',
      settings: { enabled: false }
    });
  } catch (error) {
    console.error('Disable auto-posting error:', error);
    res.status(500).json({ error: 'Failed to disable auto-posting' });
  }
});

// @route   GET /api/autopost/status
// @desc    Get auto-posting status and settings
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    res.json({
      enabled: user.autoPostingEnabled || false,
      cameraRollPath: user.cameraRollPath || process.env.CAMERA_ROLL_PATH,
      postingTimes: user.postingTimes || ['09:00', '12:00', '18:00'],
      nextPostTime: user.autoPostingEnabled ? 'Next scheduled post will be at the next optimal time' : 'Auto-posting disabled'
    });
  } catch (error) {
    console.error('Get auto-posting status error:', error);
    res.status(500).json({ error: 'Failed to get auto-posting status' });
  }
});

// @route   POST /api/autopost/test-scan
// @desc    Test scan camera roll without creating video records
// @access  Private
router.post('/test-scan', auth, async (req, res) => {
  try {
    console.log(`🔍 Test scanning camera roll for user: ${req.user.userId}`);
    
    // Just scan and analyze, don't copy or create records
    const allVideos = await cameraRollService.scanCameraRoll();
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
  } catch (error) {
    console.error('Test scan error:', error);
    res.status(500).json({ 
      error: 'Failed to test scan camera roll',
      details: error.message 
    });
  }
});

// @route   POST /api/autopost/manual-post
// @desc    Manually trigger an auto-post now
// @access  Private
router.post('/manual-post', auth, async (req, res) => {
  try {
    console.log(`🚀 Manual auto-post triggered for user: ${req.user.userId}`);
    
    // Trigger auto-posting for this user
    await schedulerService.autoPostFromCameraRoll();
    
    res.json({
      message: 'Manual auto-post completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual auto-post error:', error);
    res.status(500).json({ 
      error: 'Failed to trigger manual auto-post',
      details: error.message 
    });
  }
});

// @route   GET /api/autopost/video-matching-stats
// @desc    Get video matching cache statistics
// @access  Private
router.get('/video-matching-stats', auth, async (req, res) => {
  try {
    const videoMatchingService = require('../services/videoMatchingService');
    const stats = videoMatchingService.getCacheStats();
    
    res.json({
      cacheSize: stats.size,
      cachedVideos: stats.entries.length,
      message: `Video matching cache contains ${stats.size} entries`
    });
  } catch (error) {
    console.error('Get video matching stats error:', error);
    res.status(500).json({ error: 'Failed to get video matching stats' });
  }
});

// @route   POST /api/autopost/clear-video-cache
// @desc    Clear the video matching cache
// @access  Private
router.post('/clear-video-cache', auth, async (req, res) => {
  try {
    const videoMatchingService = require('../services/videoMatchingService');
    videoMatchingService.clearCache();
    
    res.json({
      message: 'Video matching cache cleared successfully'
    });
  } catch (error) {
    console.error('Clear video cache error:', error);
    res.status(500).json({ error: 'Failed to clear video cache' });
  }
});

// @route   GET /api/autopost/next-video
// @desc    Get next video for posting (smart selection)
// @access  Private
router.get('/next-video', auth, async (req, res) => {
  try {
    const Video = require('../models/Video');
    const video = await Video.getNextVideoForPosting(req.user.userId);
    
    if (!video) {
      return res.status(404).json({ 
        error: 'No videos available for posting',
        message: 'All videos have been posted recently. Add more videos or wait for the 7-day cooldown.'
      });
    }

    res.json({
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        duration: video.duration,
        postCount: video.postCount,
        lastPosted: video.lastPosted,
        fileName: video.fileName
      }
    });
  } catch (error) {
    console.error('Get next video error:', error);
    res.status(500).json({ error: 'Failed to get next video' });
  }
});

// @route   POST /api/autopost/mark-video-posted
// @desc    Mark a video as posted
// @access  Private
router.post('/mark-video-posted', auth, async (req, res) => {
  try {
    const { videoId } = req.body;
    const Video = require('../models/Video');
    
    await Video.markVideoAsPosted(videoId);
    
    res.json({
      message: 'Video marked as posted successfully'
    });
  } catch (error) {
    console.error('Mark video posted error:', error);
    res.status(500).json({ error: 'Failed to mark video as posted' });
  }
});

// @route   GET /api/autopost/video-stats
// @desc    Get video posting statistics
// @access  Private
router.get('/video-stats', auth, async (req, res) => {
  try {
    const Video = require('../models/Video');
    const stats = await Video.getVideoStats(req.user.userId);
    
    res.json({
      stats: {
        totalVideos: stats.totalVideos || 0,
        totalPosts: stats.totalPosts || 0,
        avgPostsPerVideo: stats.avgPostsPerVideo || 0,
        unpostedVideos: stats.unpostedVideos || 0,
        readyToRepost: stats.readyToRepost || 0
      }
    });
  } catch (error) {
    console.error('Get video stats error:', error);
    res.status(500).json({ error: 'Failed to get video stats' });
  }
});

// @route   GET /api/autopost/instagram-status
// @desc    Get Instagram connection status and setup instructions
// @access  Private
router.get('/instagram-status', auth, async (req, res) => {
  try {
    const instagramService = require('../services/instagramService');
    const isValid = await instagramService.validateCredentials();
    
    res.json({
      connected: isValid,
      setupInstructions: {
        step1: 'Connect your Instagram account to a Facebook Page',
        step2: 'Convert your Instagram account to a Business/Creator account',
        step3: 'Ensure your Facebook Page has the Instagram account connected',
        step4: 'The system will automatically detect the connection'
      },
      note: 'Instagram posting is optional - videos and cartoons will still be created and saved for manual posting'
    });
  } catch (error) {
    console.error('Get Instagram status error:', error);
    res.status(500).json({ error: 'Failed to get Instagram status' });
  }
});

// @route   POST /api/autopost/create-cartoon
// @desc    Manually create a cartoon
// @access  Private
router.post('/create-cartoon', auth, async (req, res) => {
  try {
    const cartoonService = require('../services/cartoonService');
    console.log(`🎨 Manual cartoon creation for user: ${req.user.userId}`);
    const cartoon = await cartoonService.createCompleteCartoon();
    console.log('✅ Cartoon created:', cartoon.video?.fileName || cartoon.video?.path);
    res.json({
      message: 'Cartoon created successfully',
      cartoon: {
        title: cartoon.script.title,
        duration: cartoon.video.duration,
        caption: cartoon.caption,
        hashtags: cartoon.hashtags,
        path: cartoon.video.path
      }
    });
  } catch (error) {
    console.error('❌ Create cartoon error:', error);
    if (error && error.stack) {
      console.error('❌ Stack trace:', error.stack);
    }
    res.status(500).json({ 
      error: 'Failed to create cartoon',
      details: error.message || error.toString()
    });
  }
});

// @route   GET /api/autopost/cartoon-stats
// @desc    Get cartoon statistics
// @access  Private
router.get('/cartoon-stats', auth, async (req, res) => {
  try {
    const cartoonService = require('../services/cartoonService');
    const stats = cartoonService.getCartoonStats();
    
    res.json({
      totalCartoons: stats.totalCartoons,
      recentCartoons: stats.recentCartoons,
      message: `Created ${stats.totalCartoons} cartoons total`
    });
  } catch (error) {
    console.error('Get cartoon stats error:', error);
    res.status(500).json({ error: 'Failed to get cartoon stats' });
  }
});

// @route   GET /api/autopost/cartoons
// @desc    List all cartoon videos with download links
// @access  Private
router.get('/cartoons', auth, async (req, res) => {
  try {
    const cartoonService = require('../services/cartoonService');
    const cartoonPath = cartoonService.cartoonPath;
    if (!fs.existsSync(cartoonPath)) {
      return res.json({ cartoons: [] });
    }
    const files = fs.readdirSync(cartoonPath).filter(file => file.endsWith('.mp4'));
    const cartoons = files.map(file => ({
      fileName: file,
      url: `/api/autopost/cartoons/download/${encodeURIComponent(file)}`
    }));
    res.json({ cartoons });
  } catch (error) {
    console.error('Error listing cartoon videos:', error);
    res.status(500).json({ error: 'Failed to list cartoon videos' });
  }
});

// @route   GET /api/autopost/cartoons/download/:fileName
// @desc    Download a cartoon video by filename
// @access  Private
router.get('/cartoons/download/:fileName', auth, async (req, res) => {
  try {
    const cartoonService = require('../services/cartoonService');
    const cartoonPath = cartoonService.cartoonPath;
    const fileName = req.params.fileName;
    const filePath = path.join(cartoonPath, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.download(filePath, fileName);
  } catch (error) {
    console.error('Error downloading cartoon video:', error);
    res.status(500).json({ error: 'Failed to download cartoon video' });
  }
});

// @route   POST /api/autopost/create-sample-cartoon
// @desc    Create a sample cartoon for testing
// @access  Private
router.post('/create-sample-cartoon', auth, async (req, res) => {
  try {
    const cartoonService = require('../services/cartoonService');
    console.log(`🎨 Creating sample cartoon for testing...`);
    
    const cartoon = await cartoonService.createSampleCartoon();
    
    res.json({
      message: 'Sample cartoon created successfully',
      cartoon: {
        title: cartoon.title,
        fileName: cartoon.fileName,
        duration: cartoon.duration,
        path: cartoon.path
      }
    });
  } catch (error) {
    console.error('❌ Create sample cartoon error:', error);
    res.status(500).json({ 
      error: 'Failed to create sample cartoon',
      details: error.message || error.toString()
    });
  }
});

module.exports = router; 