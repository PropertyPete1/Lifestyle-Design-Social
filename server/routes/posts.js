const express = require('express');
const Post = require('../models/Post');
const Video = require('../models/Video');
const auth = require('../middleware/auth');
const schedulerService = require('../services/schedulerService');
const aiService = require('../services/aiService');

const router = express.Router();

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      videoId,
      platform,
      scheduledTime,
      caption,
      hashtags,
      mentions,
      location,
      useAI = true
    } = req.body;

    // Validate video exists and belongs to user
    const video = await Video.findOne({
      _id: videoId,
      user: req.user.userId,
      status: 'ready'
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found or not ready' });
    }

    let postContent = {
      caption: caption || '',
      hashtags: hashtags || [],
      mentions: mentions || [],
      location: location || ''
    };

    // Generate AI content if requested
    if (useAI) {
      try {
        const aiContent = await aiService.generateCompletePost(video, platform);
        postContent = {
          ...postContent,
          caption: postContent.caption || aiContent.caption,
          hashtags: postContent.hashtags.length > 0 ? postContent.hashtags : aiContent.hashtags
        };
      } catch (error) {
        console.error('AI content generation failed:', error);
        // Continue without AI content
      }
    }

    // Create post
    const post = new Post({
      user: req.user.userId,
      video: videoId,
      platform,
      scheduledTime: new Date(scheduledTime),
      content: postContent,
      aiGenerated: {
        caption: useAI && !caption,
        hashtags: useAI && (!hashtags || hashtags.length === 0),
        timing: false
      }
    });

    await post.save();

    // Schedule the post
    await schedulerService.schedulePost(post);

    res.status(201).json({
      message: 'Post scheduled successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/posts
// @desc    Get user's posts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;
    const posts = await Post.findByUser(userId);
    const total = await Post.countByUser(userId);
    // Simple pagination (in-memory, since SQLite custom method returns all)
    const paginatedPosts = posts.slice((page - 1) * limit, page * limit);
    res.json({
      posts: paginatedPosts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user.userId
    }).populate('video');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      scheduledTime,
      caption,
      hashtags,
      mentions,
      location
    } = req.body;

    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user.userId,
      status: 'scheduled'
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found or cannot be modified' });
    }

    // Update fields
    if (scheduledTime) {
      post.scheduledTime = new Date(scheduledTime);
      // Reschedule the post
      await schedulerService.schedulePost(post);
    }
    if (caption !== undefined) post.content.caption = caption;
    if (hashtags !== undefined) post.content.hashtags = hashtags;
    if (mentions !== undefined) post.content.mentions = mentions;
    if (location !== undefined) post.content.location = location;

    await post.save();

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Cancel/delete post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Cancel scheduled post
    if (post.status === 'scheduled') {
      await schedulerService.cancelPost(req.params.id);
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    res.json({ message: 'Post cancelled successfully' });
  } catch (error) {
    console.error('Cancel post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts/:id/regenerate
// @desc    Regenerate AI content for post
// @access  Private
router.post('/:id/regenerate', auth, async (req, res) => {
  try {
    const { type = 'all' } = req.body; // 'caption', 'hashtags', 'all'

    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user.userId,
      status: 'scheduled'
    }).populate('video');

    if (!post) {
      return res.status(404).json({ error: 'Post not found or cannot be modified' });
    }

    // Regenerate AI content
    if (type === 'caption' || type === 'all') {
      const newCaption = await aiService.generateCaption(post.video);
      post.content.caption = newCaption;
      post.aiGenerated.caption = true;
    }

    if (type === 'hashtags' || type === 'all') {
      const newHashtags = await aiService.generateHashtags(post.video, post.platform);
      post.content.hashtags = newHashtags;
      post.aiGenerated.hashtags = true;
    }

    await post.save();

    res.json({
      message: 'AI content regenerated successfully',
      post
    });
  } catch (error) {
    console.error('Regenerate content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts/bulk
// @desc    Create multiple posts for a video
// @access  Private
router.post('/bulk', auth, async (req, res) => {
  try {
    const {
      videoId,
      platforms,
      times,
      useAI = true,
      caption,
      hashtags
    } = req.body;

    // Validate video exists and belongs to user
    const video = await Video.findOne({
      _id: videoId,
      user: req.user.userId,
      status: 'ready'
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found or not ready' });
    }

    const posts = [];
    const today = new Date();

    for (const platform of platforms) {
      for (const time of times) {
        const [hours, minutes] = time.split(':');
        const scheduledTime = new Date(today);
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // If time has passed today, schedule for tomorrow
        if (scheduledTime <= new Date()) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        let postContent = {
          caption: caption || '',
          hashtags: hashtags || [],
          mentions: [],
          location: ''
        };

        // Generate AI content if requested
        if (useAI) {
          try {
            const aiContent = await aiService.generateCompletePost(video, platform);
            postContent = {
              ...postContent,
              caption: postContent.caption || aiContent.caption,
              hashtags: postContent.hashtags.length > 0 ? postContent.hashtags : aiContent.hashtags
            };
          } catch (error) {
            console.error('AI content generation failed:', error);
          }
        }

        const post = new Post({
          user: req.user.userId,
          video: videoId,
          platform,
          scheduledTime,
          content: postContent,
          aiGenerated: {
            caption: useAI && !caption,
            hashtags: useAI && (!hashtags || hashtags.length === 0),
            timing: true
          }
        });

        await post.save();
        await schedulerService.schedulePost(post);
        posts.push(post);
      }
    }

    res.status(201).json({
      message: `${posts.length} posts scheduled successfully`,
      posts
    });
  } catch (error) {
    console.error('Bulk create posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/posts/analytics/summary
// @desc    Get post analytics summary
// @access  Private
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { user: req.user.userId };
    if (startDate || endDate) {
      query.scheduledTime = {};
      if (startDate) query.scheduledTime.$gte = new Date(startDate);
      if (endDate) query.scheduledTime.$lte = new Date(endDate);
    }

    const posts = await Post.find(query);

    const summary = {
      total: posts.length,
      published: posts.filter(p => p.status === 'published').length,
      scheduled: posts.filter(p => p.status === 'scheduled').length,
      failed: posts.filter(p => p.status === 'failed').length,
      cancelled: posts.filter(p => p.status === 'cancelled').length,
      totalEngagement: {
        likes: posts.reduce((sum, p) => sum + p.engagement.likes, 0),
        comments: posts.reduce((sum, p) => sum + p.engagement.comments, 0),
        shares: posts.reduce((sum, p) => sum + p.engagement.shares, 0),
        views: posts.reduce((sum, p) => sum + p.engagement.views, 0)
      },
      platformBreakdown: {
        twitter: posts.filter(p => p.platform === 'twitter').length,
        instagram: posts.filter(p => p.platform === 'instagram').length,
        both: posts.filter(p => p.platform === 'both').length
      }
    };

    res.json(summary);
  } catch (error) {
    console.error('Get analytics summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 