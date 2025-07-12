const express = require('express');
const Video = require('../models/Video');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// @route   POST /api/ai/generate-caption
// @desc    Generate AI caption for video
// @access  Private
router.post('/generate-caption', auth, async (req, res) => {
  try {
    const { videoId, platform = 'both' } = req.body;

    // Use the correct SQLite-based method
    const video = await Video.findById(videoId);

    if (!video || video.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const caption = await aiService.generateCaption(video);

    res.json({ caption });
  } catch (error) {
    console.error('Generate caption error:', error);
    res.status(500).json({ error: 'Failed to generate caption' });
  }
});

// @route   POST /api/ai/generate-hashtags
// @desc    Generate AI hashtags for video
// @access  Private
router.post('/generate-hashtags', auth, async (req, res) => {
  try {
    const { videoId, platform = 'both' } = req.body;

    // Use the correct SQLite-based method
    const video = await Video.findById(videoId);

    if (!video || video.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const hashtags = await aiService.generateHashtags(video, platform);

    res.json({ hashtags });
  } catch (error) {
    console.error('Generate hashtags error:', error);
    res.status(500).json({ error: 'Failed to generate hashtags' });
  }
});

// @route   POST /api/ai/generate-complete-post
// @desc    Generate complete AI post content
// @access  Private
router.post('/generate-complete-post', auth, async (req, res) => {
  try {
    const { videoId, platform = 'both' } = req.body;

    // Use the correct SQLite-based method
    const video = await Video.findById(videoId);

    if (!video || video.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const postContent = await aiService.generateCompletePost(video, platform);

    res.json(postContent);
  } catch (error) {
    console.error('Generate complete post error:', error);
    res.status(500).json({ error: 'Failed to generate post content' });
  }
});

// @route   GET /api/ai/optimal-times
// @desc    Get AI-suggested optimal posting times
// @access  Private
router.get('/optimal-times', auth, async (req, res) => {
  try {
    const { platform = 'both' } = req.query;
    const optimalTimes = await aiService.suggestOptimalTimes();
    
    res.json({ optimalTimes });
  } catch (error) {
    console.error('Get optimal times error:', error);
    res.status(500).json({ error: 'Failed to get optimal times' });
  }
});

// @route   POST /api/ai/analyze-engagement
// @desc    Analyze post engagement and provide insights
// @access  Private
router.post('/analyze-engagement', auth, async (req, res) => {
  try {
    const { postId } = req.body;

    // For now, return a basic analysis since we're using SQLite
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
      ]
    };

    res.json({ analysis });
  } catch (error) {
    console.error('Analyze engagement error:', error);
    res.status(500).json({ error: 'Failed to analyze engagement' });
  }
});

module.exports = router; 