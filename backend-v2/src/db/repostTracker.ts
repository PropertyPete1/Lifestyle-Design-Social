import { RepostQueue } from '../models/RepostQueue';
import { AutopilotLog } from '../models/AutopilotLog';

interface RepostLogData {
  caption: string;
  timestamp: string;
  platform?: string;
  publishedId?: string;
}

/**
 * Check if a post has already been reposted
 */
export const isAlreadyReposted = async (originalPostId: string, platform?: 'instagram' | 'youtube'): Promise<boolean> => {
  try {
    // Get settings to check repost delay
    const SettingsModel = require('../models/SettingsModel').default;
    const settings = await SettingsModel.findOne();
    const repostDelayDays = settings?.repostDelay || 1; // Default to 1 day
    
    // Calculate cutoff date based on delay setting
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - repostDelayDays);
    
    // Check if ANY platform was posted recently (global delay for the video)
    const recentRepost = await RepostQueue.findOne({
      originalPostId,
      status: { $in: ['completed', 'processing', 'scheduled'] },
      $or: [
        { postedAt: { $gte: cutoffDate } }, // Posted within delay period
        { updatedAt: { $gte: cutoffDate } } // Updated within delay period (fallback)
      ]
    });

    // Check AutopilotLog for recent reposts (within delay period)
    const recentLog = await AutopilotLog.findOne({
      originalPostId,
      type: 'repost',
      createdAt: { $gte: cutoffDate } // Created within delay period
    });

    if (recentRepost || recentLog) {
      const lastPostDate = recentRepost?.postedAt || recentRepost?.updatedAt || recentLog?.createdAt;
      const daysSincePost = lastPostDate ? Math.floor((Date.now() - lastPostDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const platformInfo = recentLog?.platform || recentRepost?.targetPlatform || 'any platform';
      console.log(`⏳ ${originalPostId} was last posted to ${platformInfo} ${daysSincePost} days ago (delay: ${repostDelayDays} days)`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error checking repost status for ${originalPostId}:`, error);
    return false; // Assume not reposted on error to avoid blocking
  }
};

/**
 * Store repost log for tracking
 */
export const storeRepostLog = async (originalPostId: string, logData: RepostLogData): Promise<void> => {
  try {
    const now = new Date();
    
    // Store in AutopilotLog for history tracking (each platform gets separate entry)
    await AutopilotLog.create({
      runId: `repost_${Date.now()}_${logData.platform}`,
      type: 'repost',
      status: 'completed',
      originalPostId,
      caption: logData.caption,
      timestamp: logData.timestamp,
      platform: logData.platform || 'instagram',
      publishedId: logData.publishedId,
      startTime: now,
      endTime: now,
      duration: 0,
      createdAt: now // Explicit timestamp for delay checking
    });
    
    // Create/update RepostQueue entry for delay tracking (global per video)
    await RepostQueue.findOneAndUpdate(
      { originalPostId, targetPlatform: logData.platform === 'youtube' ? 'youtube' : 'instagram' },
      {
        originalPostId,
        status: 'completed',
        postedAt: now,
        updatedAt: now,
        targetPlatform: logData.platform === 'youtube' ? 'youtube' : 'instagram'
      },
      { upsert: true, new: true }
    );

    console.log(`📝 Repost log stored for ${originalPostId} on ${logData.platform} with timestamp ${now.toISOString()}`);
  } catch (error) {
    console.error(`❌ Failed to store repost log for ${originalPostId}:`, error);
    // Don't throw error - logging failure shouldn't stop the repost process
  }
};

/**
 * Get repost history for a specific post
 */
export const getRepostHistory = async (originalPostId: string): Promise<any[]> => {
  try {
    const history = await AutopilotLog.find({
      originalPostId,
      type: 'repost'
    }).sort({ createdAt: -1 });

    return history;
  } catch (error) {
    console.error(`❌ Error fetching repost history for ${originalPostId}:`, error);
    return [];
  }
};

/**
 * Clear repost history (for testing purposes)
 */
export const clearRepostHistory = async (): Promise<number> => {
  try {
    const logResult = await AutopilotLog.deleteMany({
      type: 'repost'
    });
    
    const queueResult = await RepostQueue.deleteMany({});

    const totalDeleted = (logResult.deletedCount || 0) + (queueResult.deletedCount || 0);
    console.log(`🗑️ Cleared ${totalDeleted} repost entries (${logResult.deletedCount || 0} logs + ${queueResult.deletedCount || 0} queue)`);
    return totalDeleted;
  } catch (error) {
    console.error('❌ Error clearing repost history:', error);
    return 0;
  }
};

/**
 * Clean up old repost entries based on current delay settings
 */
export const cleanupOldReposts = async (): Promise<number> => {
  try {
    const SettingsModel = require('../models/SettingsModel').default;
    const settings = await SettingsModel.findOne();
    const repostDelayDays = settings?.repostDelay || 1;
    
    // Calculate cutoff date (keep entries within delay period + 30 days for history)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (repostDelayDays + 30));
    
    const logResult = await AutopilotLog.deleteMany({
      type: 'repost',
      createdAt: { $lt: cutoffDate }
    });
    
    const queueResult = await RepostQueue.deleteMany({
      postedAt: { $lt: cutoffDate }
    });

    const totalDeleted = (logResult.deletedCount || 0) + (queueResult.deletedCount || 0);
    if (totalDeleted > 0) {
      console.log(`🧹 Cleaned up ${totalDeleted} old repost entries (older than ${repostDelayDays + 30} days)`);
    }
    return totalDeleted;
  } catch (error) {
    console.error('❌ Error cleaning up old reposts:', error);
    return 0;
  }
};