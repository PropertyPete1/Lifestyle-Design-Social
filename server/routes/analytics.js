const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/overview
// @desc    Get analytics overview
// @access  Private
router.get('/overview', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const posts = await Post.findByUser(userId);

    const overview = {
      totalPosts: posts.length,
      publishedPosts: posts.filter(p => p.status === 'published').length,
      successRate: posts.length > 0 ? (posts.filter(p => p.status === 'published').length / posts.length * 100).toFixed(2) : 0,
      totalEngagement: {
        likes: posts.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0),
        comments: posts.reduce((sum, p) => sum + (p.engagement?.comments || 0), 0),
        shares: posts.reduce((sum, p) => sum + (p.engagement?.shares || 0), 0),
        views: posts.reduce((sum, p) => sum + (p.engagement?.views || 0), 0)
      },
      averageEngagement: posts.length > 0 ? {
        likes: Math.round(posts.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0) / posts.length),
        comments: Math.round(posts.reduce((sum, p) => sum + (p.engagement?.comments || 0), 0) / posts.length),
        shares: Math.round(posts.reduce((sum, p) => sum + (p.engagement?.shares || 0), 0) / posts.length),
        views: Math.round(posts.reduce((sum, p) => sum + (p.engagement?.views || 0), 0) / posts.length)
      } : { likes: 0, comments: 0, shares: 0, views: 0 }
    };

    res.json(overview);
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/platform-performance
// @desc    Get platform performance comparison
// @access  Private
router.get('/platform-performance', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { user: req.user.userId, status: 'published' };
    if (startDate || endDate) {
      query.scheduledTime = {};
      if (startDate) query.scheduledTime.$gte = new Date(startDate);
      if (endDate) query.scheduledTime.$lte = new Date(endDate);
    }

    const posts = await Post.find(query);

    const platformData = {
      twitter: posts.filter(p => p.platform === 'twitter'),
      instagram: posts.filter(p => p.platform === 'instagram'),
      both: posts.filter(p => p.platform === 'both')
    };

    const performance = {
      twitter: {
        posts: platformData.twitter.length,
        totalEngagement: {
          likes: platformData.twitter.reduce((sum, p) => sum + p.engagement.likes, 0),
          comments: platformData.twitter.reduce((sum, p) => sum + p.engagement.comments, 0),
          shares: platformData.twitter.reduce((sum, p) => sum + p.engagement.shares, 0),
          views: platformData.twitter.reduce((sum, p) => sum + p.engagement.views, 0)
        },
        averageEngagement: platformData.twitter.length > 0 ? {
          likes: Math.round(platformData.twitter.reduce((sum, p) => sum + p.engagement.likes, 0) / platformData.twitter.length),
          comments: Math.round(platformData.twitter.reduce((sum, p) => sum + p.engagement.comments, 0) / platformData.twitter.length),
          shares: Math.round(platformData.twitter.reduce((sum, p) => sum + p.engagement.shares, 0) / platformData.twitter.length),
          views: Math.round(platformData.twitter.reduce((sum, p) => sum + p.engagement.views, 0) / platformData.twitter.length)
        } : { likes: 0, comments: 0, shares: 0, views: 0 }
      },
      instagram: {
        posts: platformData.instagram.length,
        totalEngagement: {
          likes: platformData.instagram.reduce((sum, p) => sum + p.engagement.likes, 0),
          comments: platformData.instagram.reduce((sum, p) => sum + p.engagement.comments, 0),
          shares: platformData.instagram.reduce((sum, p) => sum + p.engagement.shares, 0),
          views: platformData.instagram.reduce((sum, p) => sum + p.engagement.views, 0)
        },
        averageEngagement: platformData.instagram.length > 0 ? {
          likes: Math.round(platformData.instagram.reduce((sum, p) => sum + p.engagement.likes, 0) / platformData.instagram.length),
          comments: Math.round(platformData.instagram.reduce((sum, p) => sum + p.engagement.comments, 0) / platformData.instagram.length),
          shares: Math.round(platformData.instagram.reduce((sum, p) => sum + p.engagement.shares, 0) / platformData.instagram.length),
          views: Math.round(platformData.instagram.reduce((sum, p) => sum + p.engagement.views, 0) / platformData.instagram.length)
        } : { likes: 0, comments: 0, shares: 0, views: 0 }
      }
    };

    res.json(performance);
  } catch (error) {
    console.error('Get platform performance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/top-posts
// @desc    Get top performing posts
// @access  Private
router.get('/top-posts', auth, async (req, res) => {
  try {
    const { limit = 10, metric = 'likes' } = req.query;
    
    const posts = await Post.find({
      user: req.user.userId,
      status: 'published'
    })
    .populate('video', 'title thumbnail')
    .sort({ [`engagement.${metric}`]: -1 })
    .limit(parseInt(limit));

    res.json(posts);
  } catch (error) {
    console.error('Get top posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics
// @desc    Get analytics data with filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { timeRange = '30d', platform = 'all' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    // Build query
    let query = { userId, status: 'published' };
    if (platform !== 'all') {
      query.platform = platform;
    }
    
    const posts = await Post.findByUser(userId);
    const filteredPosts = posts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= startDate && postDate <= now;
    });
    
    const analytics = {
      summary: {
        totalPosts: filteredPosts.length,
        publishedPosts: filteredPosts.filter(p => p.status === 'published').length,
        successRate: filteredPosts.length > 0 ? (filteredPosts.filter(p => p.status === 'published').length / filteredPosts.length * 100).toFixed(2) : 0,
      },
      engagement: {
        total: {
          likes: filteredPosts.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0),
          comments: filteredPosts.reduce((sum, p) => sum + (p.engagement?.comments || 0), 0),
          shares: filteredPosts.reduce((sum, p) => sum + (p.engagement?.shares || 0), 0),
          views: filteredPosts.reduce((sum, p) => sum + (p.engagement?.views || 0), 0)
        },
        average: filteredPosts.length > 0 ? {
          likes: Math.round(filteredPosts.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0) / filteredPosts.length),
          comments: Math.round(filteredPosts.reduce((sum, p) => sum + (p.engagement?.comments || 0), 0) / filteredPosts.length),
          shares: Math.round(filteredPosts.reduce((sum, p) => sum + (p.engagement?.shares || 0), 0) / filteredPosts.length),
          views: Math.round(filteredPosts.reduce((sum, p) => sum + (p.engagement?.views || 0), 0) / filteredPosts.length)
        } : { likes: 0, comments: 0, shares: 0, views: 0 }
      },
      timeRange,
      platform,
      posts: filteredPosts.slice(0, 10) // Return top 10 recent posts
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 