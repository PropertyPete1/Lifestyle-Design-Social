import express from 'express';
import { peakHoursScheduler } from '../../lib/peakHours/scheduler';
import PeakEngagementTimes from '../../models/PeakEngagementTimes';

const router = express.Router();

// Get optimal posting times
router.get('/optimal-times', async (req, res) => {
  try {
    const { platform, limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 10;
    
    const validPlatforms = ['youtube', 'instagram'];
    const platformFilter = platform && validPlatforms.includes(platform as string) 
      ? platform as 'youtube' | 'instagram' 
      : undefined;

    const optimalTimes = await peakHoursScheduler.getOptimalTimes(platformFilter, limitNum);
    
    res.json({
      success: true,
      data: optimalTimes,
      platform: platformFilter || 'all',
      limit: limitNum
    });

  } catch (error) {
    console.error('❌ Error getting optimal times:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get optimal posting times',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get analysis status
router.get('/status', async (req, res) => {
  try {
    const status = await peakHoursScheduler.getAnalysisStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Error getting analysis status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Trigger manual analysis
router.post('/analyze', async (req, res) => {
  try {
    const { platform } = req.body;
    
    if (peakHoursScheduler.isAnalysisRunning()) {
      return res.status(409).json({
        success: false,
        error: 'Analysis already running',
        message: 'Please wait for the current analysis to complete'
      });
    }

    // Start analysis in background
    if (platform === 'youtube') {
      peakHoursScheduler.runYouTubeAnalysis().catch(error => {
        console.error('❌ Background YouTube analysis failed:', error);
      });
      
      res.json({
        success: true,
        message: 'YouTube peak hours analysis started',
        platform: 'youtube'
      });
      
    } else if (platform === 'instagram') {
      peakHoursScheduler.runInstagramAnalysis().catch(error => {
        console.error('❌ Background Instagram analysis failed:', error);
      });
      
      res.json({
        success: true,
        message: 'Instagram peak hours analysis started',
        platform: 'instagram'
      });
      
    } else {
      peakHoursScheduler.runFullAnalysis().catch(error => {
        console.error('❌ Background full analysis failed:', error);
      });
      
      res.json({
        success: true,
        message: 'Full peak hours analysis started for both platforms',
        platform: 'all'
      });
    }

  } catch (error) {
    console.error('❌ Error starting analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get raw peak engagement data
router.get('/data', async (req, res) => {
  try {
    const { platform, dayOfWeek, minScore } = req.query;
    
    const filter: any = {};
    
    if (platform && ['youtube', 'instagram'].includes(platform as string)) {
      filter.platform = platform;
    }
    
    if (dayOfWeek) {
      filter.dayOfWeek = dayOfWeek;
    }
    
    if (minScore) {
      filter.avgScore = { $gte: parseFloat(minScore as string) };
    }

    const data = await PeakEngagementTimes
      .find(filter)
      .sort({ platform: 1, dayOfWeek: 1, hour: 1 })
      .lean();
    
    // Group by platform for easier consumption
    const groupedData = data.reduce((acc: any, item) => {
      if (!acc[item.platform]) {
        acc[item.platform] = [];
      }
      acc[item.platform].push({
        dayOfWeek: item.dayOfWeek,
        hour: item.hour,
        score: item.avgScore,
        totalPosts: item.totalPosts,
        lastUpdated: item.lastUpdated,
        timeSlot: `${item.dayOfWeek} ${formatHour(item.hour)}`
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: groupedData,
      totalRecords: data.length,
      filters: { platform, dayOfWeek, minScore }
    });

  } catch (error) {
    console.error('❌ Error getting peak engagement data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get peak engagement data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start/stop scheduler
router.post('/scheduler/:action', async (req, res) => {
  try {
    const { action } = req.params;
    
    if (action === 'start') {
      peakHoursScheduler.startScheduler();
      res.json({
        success: true,
        message: 'Peak hours scheduler started',
        nextRun: '2:00 AM daily'
      });
      
    } else if (action === 'stop') {
      peakHoursScheduler.stopScheduler();
      res.json({
        success: true,
        message: 'Peak hours scheduler stopped'
      });
      
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid action',
        validActions: ['start', 'stop']
      });
    }

  } catch (error) {
    console.error('❌ Error controlling scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to control scheduler',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get best time for specific day
router.get('/best-time/:dayOfWeek', async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const { platform } = req.query;
    
    const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (!validDays.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid day of week',
        validDays
      });
    }
    
    const filter: any = { dayOfWeek };
    if (platform && ['youtube', 'instagram'].includes(platform as string)) {
      filter.platform = platform;
    }

    const bestTimes = await PeakEngagementTimes
      .find(filter)
      .sort({ avgScore: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: bestTimes.map(time => ({
        platform: time.platform,
        hour: time.hour,
        score: time.avgScore,
        totalPosts: time.totalPosts,
        timeSlot: formatHour(time.hour)
      })),
      dayOfWeek,
      platform: platform || 'all'
    });

  } catch (error) {
    console.error('❌ Error getting best time for day:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get best time for day',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${ampm}`;
}

export default router; 