const express = require('express');
const auth = require('../middleware/auth');
const schedulerService = require('../services/schedulerService');
const aiService = require('../services/aiService');

const router = express.Router();

// @route   GET /api/schedule/optimal-times
// @desc    Get optimal posting times
// @access  Private
router.get('/optimal-times', auth, async (req, res) => {
  try {
    const { platform = 'both' } = req.query;
    const optimalTimes = await schedulerService.getOptimalTimes(req.user.userId, platform);
    
    res.json({ optimalTimes });
  } catch (error) {
    console.error('Get optimal times error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/schedule/scheduled-jobs
// @desc    Get currently scheduled jobs
// @access  Private
router.get('/scheduled-jobs', auth, async (req, res) => {
  try {
    const jobs = schedulerService.getScheduledJobs();
    res.json({ jobs });
  } catch (error) {
    console.error('Get scheduled jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 