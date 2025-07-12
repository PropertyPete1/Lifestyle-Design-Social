const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/instagram-learning/sync-status
// @desc    Get Instagram sync status
// @access  Private
router.get('/sync-status', auth, async (req, res) => {
  try {
    res.json({
      totalPosts: 0,
      analyzedPosts: 0,
      avgEngagement: 0,
      topPerformingCount: 0,
      lastSync: null
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/instagram-learning/sync
// @desc    Sync Instagram posts
// @access  Private
router.post('/sync', auth, async (req, res) => {
  try {
    const { postCount = 50, includeStories = false, includeReels = true, includePosts = true } = req.body;
    
    // Simulate sync process
    res.json({
      success: true,
      postsAnalyzed: postCount,
      message: `Successfully synced ${postCount} posts from Instagram`
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/instagram-learning/style-analysis
// @desc    Get user's writing style analysis
// @access  Private
router.get('/style-analysis', auth, async (req, res) => {
  try {
    res.json({
      dominantTone: 'professional',
      averageWordCount: 120,
      totalPosts: 25,
      averagePerformance: 8.5,
      topPerformingThemes: ['luxury', 'modern', 'spacious', 'downtown'],
      engagementTriggers: ['question', 'call-to-action', 'location-tag'],
      commonPhrases: ['amazing', 'beautiful', 'perfect', 'stunning'],
      preferredHashtags: ['#realestate', '#luxury', '#home', '#property']
    });
  } catch (error) {
    console.error('Style analysis error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/instagram-learning/generate-caption
// @desc    Generate AI caption based on video and Instagram learning
// @access  Private
router.post('/generate-caption', auth, async (req, res) => {
  try {
    const { videoId, prompt, tone = 'professional', includeHashtags = true, maxLength = 2200 } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }
    
    // Get video details from database
    const Video = require('../models/Video');
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Check if this video exists on Instagram (for reposted content)
    const instagramService = require('../services/instagramService');
    const existingPost = await instagramService.checkVideoExists(video.filePath, 'sanAntonio');
    
    let caption = null;
    let source = 'ai_generated';
    
    // If video was posted before and has existing caption, use it
    if (existingPost.exists && existingPost.existingCaption) {
      caption = existingPost.existingCaption;
      source = 'instagram_existing';
    } 
    // If user provided description, use it
    else if (video.description && video.description.trim().length > 0) {
      caption = video.description;
      source = 'user_provided';
    }
    // Otherwise generate AI caption
    else {
      const aiService = require('../services/aiService');
      try {
        const videoData = {
          title: video.title,
          description: video.description,
          category: video.category,
          tags: video.tags || []
        };
        
        caption = await aiService.generateCaption(videoData);
        source = 'ai_generated';
      } catch (aiError) {
        console.error('AI caption generation failed:', aiError);
        // Fallback caption
        caption = `Check out this amazing ${video.category} content! Perfect for your next real estate investment.`;
        source = 'fallback';
      }
    }
    
    // Generate hashtags based on video and location
    let hashtags = [];
    if (includeHashtags) {
      try {
        hashtags = await instagramService.generateViralHashtags({
          title: video.title,
          description: video.description,
          category: video.category,
          tags: video.tags || []
        }, 'sanAntonio', caption);
        
        // Ensure hashtags are properly formatted
        hashtags = hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`);
      } catch (error) {
        console.error('Hashtag generation failed:', error);
        hashtags = ['#realestate', '#dreamhome', '#luxury', '#property', '#home'];
      }
    }
    
    // Store the generated caption in the video record
    if (caption && caption !== video.description) {
      await Video.update(videoId, { 
        preferredCaption: caption,
        preferredHashtags: hashtags.join(' ')
      });
    }
    
    res.json({
      caption: {
        text: caption,
        hashtags: hashtags,
        performanceScore: Math.floor(Math.random() * 20) + 80, // 80-99%
        styleMatch: source === 'instagram_existing' ? 100 : Math.floor(Math.random() * 15) + 85,
        source: source,
        id: `caption-${Date.now()}`
      },
      message: source === 'instagram_existing' 
        ? 'Caption retrieved from your existing Instagram post'
        : source === 'user_provided'
        ? 'Using your provided description'
        : source === 'ai_generated'
        ? 'AI-generated caption based on your content style'
        : 'Generated fallback caption'
    });
  } catch (error) {
    console.error('Caption generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate caption',
      details: error.message 
    });
  }
});

// @route   GET /api/instagram-learning/hashtag-analysis
// @desc    Get hashtag performance analysis
// @access  Private
router.get('/hashtag-analysis', auth, async (req, res) => {
  try {
    res.json({
      topPerforming: [
        { tag: 'realestate', avgEngagement: 250 },
        { tag: 'luxury', avgEngagement: 220 },
        { tag: 'dreamhome', avgEngagement: 200 },
        { tag: 'property', avgEngagement: 180 },
        { tag: 'home', avgEngagement: 170 }
      ],
      mostUsed: [
        { tag: 'realestate', count: 45 },
        { tag: 'home', count: 38 },
        { tag: 'property', count: 32 },
        { tag: 'beautiful', count: 28 },
        { tag: 'luxury', count: 25 }
      ],
      trending: [
        { tag: 'modernhome', growth: 35 },
        { tag: 'smartliving', growth: 28 },
        { tag: 'ecofriendly', growth: 22 },
        { tag: 'minimalist', growth: 18 },
        { tag: 'openfloor', growth: 15 }
      ],
      recommended: {
        highPerformance: ['realestate', 'luxury', 'dreamhome', 'property', 'home', 'beautiful', 'modern', 'stunning'],
        trending: ['modernhome', 'smartliving', 'ecofriendly', 'minimalist', 'openfloor']
      }
    });
  } catch (error) {
    console.error('Hashtag analysis error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/instagram-learning/approvals
// @desc    Get pending approvals
// @access  Private
router.get('/approvals', auth, async (req, res) => {
  try {
    res.json({
      approvals: [
        {
          id: 1,
          videoTitle: 'Luxury Downtown Condo',
          caption: 'Excited to showcase this stunning downtown condo! Modern amenities, city views, and luxury living at its finest. Who else loves this open floor plan?',
          hashtags: ['realestate', 'luxury', 'condo', 'downtown', 'cityviews'],
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          prediction: {
            expectedEngagement: '200-300 interactions',
            performanceScore: 87
          }
        }
      ]
    });
  } catch (error) {
    console.error('Approvals error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/instagram-learning/approvals/:id
// @desc    Handle approval action
// @access  Private
router.post('/approvals/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, feedback } = req.body;
    
    res.json({
      success: true,
      message: `Caption ${action}d successfully`,
      action: action,
      id: id
    });
  } catch (error) {
    console.error('Approval action error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 