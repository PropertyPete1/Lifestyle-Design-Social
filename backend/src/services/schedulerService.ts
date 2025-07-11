import { logger } from '../utils/logger';
import { UserModel } from '../models/User';
import { PostModel } from '../models/Post';
import { pool } from '../config/database';
import { AutoPostingService } from './autoPostingService';
import { AnalyticsService } from './analyticsService';

export interface ScheduleConfig {
  userId: string;
  enabled: boolean;
  times: string[];
  days: number[];
  postsPerDay: number;
  categoryRotation: string[];
  timezone: string;
  testMode: boolean;
}

export interface ScheduleResult {
  success: boolean;
  scheduledPosts: number;
  errors: string[];
  nextExecution: Date;
}

export interface TimingOptimization {
  bestTimes: string[];
  bestDays: number[];
  recommendedFrequency: number;
  timezone: string;
}

export class SchedulerService {
  private userModel: UserModel;
  private postModel: PostModel;
  private autoPostingService: AutoPostingService;
  private analyticsService: AnalyticsService;

  constructor() {
    this.userModel = new UserModel(pool);
    this.postModel = new PostModel(pool);
    this.autoPostingService = new AutoPostingService();
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Schedule posts for a user
   */
  async schedulePosts(userId: string, days: number = 7): Promise<ScheduleResult> {
    try {
      logger.info(`Scheduling posts for user ${userId} for ${days} days`);

      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const config: ScheduleConfig = {
        userId,
        enabled: user.autoPostingEnabled || false,
        times: user.postingTimes || ['09:00', '13:00', '18:00'],
        days: [1, 2, 3, 4, 5, 6, 7], // All days
        postsPerDay: 3,
        categoryRotation: ['real-estate', 'cartoon'],
        timezone: user.timezone || 'America/Chicago',
        testMode: user.testMode || false,
      };

      if (!config.enabled) {
        return {
          success: false,
          scheduledPosts: 0,
          errors: ['Auto-posting is disabled for this user'],
          nextExecution: new Date(),
        };
      }

      const results = await this.autoPostingService.schedulePosts(userId, days);
      
      const successCount = results.filter(r => r.success).length;
      const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error');

      const nextExecution = this.calculateNextExecution(config);

      logger.info(`Scheduled ${successCount} posts for user ${userId}`);

      return {
        success: successCount > 0,
        scheduledPosts: successCount,
        errors,
        nextExecution,
      };
    } catch (error) {
      logger.error('Failed to schedule posts:', error);
      return {
        success: false,
        scheduledPosts: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        nextExecution: new Date(),
      };
    }
  }

  /**
   * Execute scheduled posts
   */
  async executeScheduledPosts(): Promise<ScheduleResult> {
    try {
      logger.info('Executing scheduled posts...');

      const now = new Date();
      const scheduledPosts = await this.postModel.findByStatus('scheduled', {
        scheduledTime: { $lte: now },
      });

      if (scheduledPosts.length === 0) {
        logger.info('No scheduled posts to execute');
        return {
          success: true,
          scheduledPosts: 0,
          errors: [],
          nextExecution: this.calculateNextExecutionTime(),
        };
      }

      const results = await this.autoPostingService.executeScheduledPosts();
      
      const successCount = results.filter(r => r.success).length;
      const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error');

      logger.info(`Executed ${successCount} scheduled posts`);

      return {
        success: successCount > 0,
        scheduledPosts: successCount,
        errors,
        nextExecution: this.calculateNextExecutionTime(),
      };
    } catch (error) {
      logger.error('Failed to execute scheduled posts:', error);
      return {
        success: false,
        scheduledPosts: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        nextExecution: new Date(),
      };
    }
  }

  /**
   * Optimize posting times based on engagement data
   */
  async optimizePostingTimes(userId: string): Promise<TimingOptimization> {
    try {
      logger.info(`Optimizing posting times for user ${userId}`);

      // Get engagement data
      const engagementData = await this.analyticsService.getBestPostingTimes(userId, 90);
      
      // Get user's current schedule
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Analyze best times
      const bestTimes = engagementData.bestTimes || ['09:00', '13:00', '18:00'];
      
      // Analyze best days (for now, assume all days are good)
      const bestDays = [1, 2, 3, 4, 5, 6, 7];

      // Calculate recommended frequency based on engagement
      const analytics = await this.analyticsService.getUserAnalytics(userId, 30);
      const recommendedFrequency = this.calculateOptimalFrequency(analytics);

      const optimization: TimingOptimization = {
        bestTimes,
        bestDays,
        recommendedFrequency,
        timezone: user.timezone || 'America/Chicago',
      };

      // Update user's posting times if optimization suggests changes
      if (JSON.stringify(bestTimes) !== JSON.stringify(user.postingTimes)) {
        await this.userModel.updatePostingSettings(userId, {
          postingTimes: bestTimes,
        });
        logger.info(`Updated posting times for user ${userId}: ${bestTimes.join(', ')}`);
      }

      return optimization;
    } catch (error) {
      logger.error('Failed to optimize posting times:', error);
      return {
        bestTimes: ['09:00', '13:00', '18:00'],
        bestDays: [1, 2, 3, 4, 5, 6, 7],
        recommendedFrequency: 3,
        timezone: 'America/Chicago',
      };
    }
  }

  /**
   * Calculate optimal posting frequency
   */
  private calculateOptimalFrequency(analytics: any): number {
    const { totalPosts, averageEngagementRate } = analytics;

    // Base frequency on engagement rate
    if (averageEngagementRate > 5) {
      return 4; // High engagement - post more
    } else if (averageEngagementRate > 2) {
      return 3; // Good engagement - maintain
    } else {
      return 2; // Low engagement - post less
    }
  }

  /**
   * Get schedule status for a user
   */
  async getScheduleStatus(userId: string): Promise<any> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const scheduledPosts = await this.postModel.findByUser(userId, {
        status: 'scheduled',
        limit: 10,
      });

      const nextExecution = this.calculateNextExecution({
        userId,
        enabled: user.autoPostingEnabled || false,
        times: user.postingTimes || ['09:00', '13:00', '18:00'],
        days: [1, 2, 3, 4, 5, 6, 7],
        postsPerDay: 3,
        categoryRotation: ['real-estate', 'cartoon'],
        timezone: user.timezone || 'America/Chicago',
        testMode: user.testMode || false,
      });

      return {
        enabled: user.autoPostingEnabled || false,
        testMode: user.testMode || false,
        postingTimes: user.postingTimes || ['09:00', '13:00', '18:00'],
        timezone: user.timezone || 'America/Chicago',
        scheduledPosts: scheduledPosts.length,
        nextExecution,
        lastOptimization: user.lastOptimization || null,
      };
    } catch (error) {
      logger.error('Failed to get schedule status:', error);
      throw error;
    }
  }

  /**
   * Pause scheduling for a user
   */
  async pauseScheduling(userId: string): Promise<void> {
    try {
      await this.userModel.updatePostingSettings(userId, {
        autoPostingEnabled: false,
      });
      logger.info(`Paused scheduling for user ${userId}`);
    } catch (error) {
      logger.error('Failed to pause scheduling:', error);
      throw error;
    }
  }

  /**
   * Resume scheduling for a user
   */
  async resumeScheduling(userId: string): Promise<void> {
    try {
      await this.userModel.updatePostingSettings(userId, {
        autoPostingEnabled: true,
      });
      logger.info(`Resumed scheduling for user ${userId}`);
    } catch (error) {
      logger.error('Failed to resume scheduling:', error);
      throw error;
    }
  }

  /**
   * Update schedule configuration
   */
  async updateScheduleConfig(userId: string, config: Partial<ScheduleConfig>): Promise<void> {
    try {
      const updateData: any = {};

      if (config.times) {
        updateData.postingTimes = config.times;
      }

      if (config.timezone) {
        updateData.timezone = config.timezone;
      }

      if (config.testMode !== undefined) {
        updateData.testMode = config.testMode;
      }

      if (config.enabled !== undefined) {
        updateData.autoPostingEnabled = config.enabled;
      }

      await this.userModel.updatePostingSettings(userId, updateData);
      logger.info(`Updated schedule config for user ${userId}`);
    } catch (error) {
      logger.error('Failed to update schedule config:', error);
      throw error;
    }
  }

  /**
   * Calculate next execution time
   */
  private calculateNextExecution(config: ScheduleConfig): Date {
    const now = new Date();
    const nextTime = config.times[0] || '09:00';
    const [hours, minutes] = nextTime.split(':').map(Number);
    
    const nextExecution = new Date(now);
    nextExecution.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (nextExecution <= now) {
      nextExecution.setDate(nextExecution.getDate() + 1);
    }
    
    return nextExecution;
  }

  /**
   * Calculate next execution time (generic)
   */
  private calculateNextExecutionTime(): Date {
    const now = new Date();
    const nextExecution = new Date(now);
    nextExecution.setHours(9, 0, 0, 0); // Default to 9 AM
    
    if (nextExecution <= now) {
      nextExecution.setDate(nextExecution.getDate() + 1);
    }
    
    return nextExecution;
  }

  /**
   * Get scheduler statistics
   */
  async getSchedulerStats(): Promise<any> {
    try {
      const users = await this.userModel.findAll();
      const enabledUsers = users.filter(user => user.autoPostingEnabled);
      
      const scheduledPosts = await this.postModel.findByStatus('scheduled');
      const postedToday = await this.postModel.findByStatus('posted', {
        postedTime: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      });

      return {
        totalUsers: users.length,
        enabledUsers: enabledUsers.length,
        scheduledPosts: scheduledPosts.length,
        postedToday: postedToday.length,
        nextExecution: this.calculateNextExecutionTime(),
      };
    } catch (error) {
      logger.error('Failed to get scheduler stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old scheduled posts
   */
  async cleanupOldScheduledPosts(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldPosts = await this.postModel.findByStatus('scheduled', {
        scheduledTime: { $lt: cutoffDate },
      });

      let deletedCount = 0;
      for (const post of oldPosts) {
        try {
          await this.postModel.delete(post.id);
          deletedCount++;
        } catch (error) {
          logger.error(`Failed to delete old scheduled post ${post.id}:`, error);
        }
      }

      logger.info(`Cleaned up ${deletedCount} old scheduled posts`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old scheduled posts:', error);
      throw error;
    }
  }
}

export default SchedulerService; 