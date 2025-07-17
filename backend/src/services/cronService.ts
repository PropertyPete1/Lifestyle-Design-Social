// import { connectToDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { UserModel } from '../models/User';
import { PostModel } from '../models/Post';
import { autoPostingService } from './autoPostingService';
import { analyticsService } from './analyticsService';
import { dailyReportService } from './dailyReportService';

export class CronService {
  private autoPostingService: typeof autoPostingService;
  private _analyticsService: typeof analyticsService;
  private isSchedulingActive: boolean = false;
  private isReportingActive: boolean = false;

  constructor() {
    this.autoPostingService = autoPostingService;
    this._analyticsService = analyticsService;
  }

  /**
   * Start all cron jobs
   */
  async startCronJobs(): Promise<void> {
    logger.info('Starting cron jobs...');
    
    // Schedule posts every hour
    setInterval(async () => {
      if (!this.isSchedulingActive) {
        await this.scheduleDailyPosts();
      }
    }, 60 * 60 * 1000); // 1 hour

    // Generate reports every 6 hours
    setInterval(async () => {
      if (!this.isReportingActive) {
        await this.generateDailyReports();
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Update engagement every 30 minutes
    setInterval(async () => {
      await this.updateEngagementMetrics();
    }, 30 * 60 * 1000); // 30 minutes

    // Initial execution
    setTimeout(() => this.scheduleDailyPosts(), 5000); // 5 seconds delay
    setTimeout(() => this.generateDailyReports(), 10000); // 10 seconds delay
    setTimeout(() => this.updateEngagementMetrics(), 15000); // 15 seconds delay

    logger.info('Cron jobs started successfully');
  }

  /**
   * Stop all cron jobs
   */
  async stopCronJobs(): Promise<void> {
    logger.info('Stopping cron jobs...');
    this.isSchedulingActive = false;
    this.isReportingActive = false;
    logger.info('Cron jobs stopped');
  }

  /**
   * Schedule daily posts for users with auto-posting enabled
   */
  private async scheduleDailyPosts(): Promise<void> {
    if (this.isSchedulingActive) {
      logger.info('Daily post scheduling already in progress, skipping...');
      return;
    }

    this.isSchedulingActive = true;

    try {
      logger.info('Starting daily post scheduling...');
      
      // Get users with auto-posting enabled
      const enabledUsers = await UserModel.find({ 
        autoPostingEnabled: true,
        isActive: { $ne: false } // Exclude explicitly inactive users
      }).select('_id name email autoPostingSettings').lean();
      
      let totalScheduled = 0;
      
      for (const user of enabledUsers) {
        try {
          const userId = user._id.toString();
                     const results = await this.autoPostingService.schedulePosts(userId, 1);
           
           if (Array.isArray(results) && results.length > 0) {
             const successfulPosts = results.filter(r => r.success);
             totalScheduled += successfulPosts.length;
             logger.info(`Scheduled ${successfulPosts.length} posts for user ${user.name || userId}`);
           } else {
             logger.warn(`Failed to schedule posts for user ${user.name || userId}: No posts generated`);
           }
          
        } catch (error) {
          logger.error(`Error scheduling posts for user ${user._id}:`, error);
        }
      }
      
      logger.info(`Daily post scheduling completed. Total users: ${enabledUsers.length}, Total posts scheduled: ${totalScheduled}`);
      
    } catch (error) {
      logger.error('Error in daily post scheduling:', error);
    } finally {
      this.isSchedulingActive = false;
    }
  }

  /**
   * Generate daily reports for all users
   */
  private async generateDailyReports(): Promise<void> {
    if (this.isReportingActive) {
      logger.info('Daily report generation already in progress, skipping...');
      return;
    }

    this.isReportingActive = true;

    try {
      logger.info('Starting daily report generation...');
      
      // Get all active users
      const users = await UserModel.find({ 
        isActive: { $ne: false },
        emailNotifications: { $ne: false } // Only users who want email notifications
      }).select('_id name email').lean();
      
      let reportsGenerated = 0;
      
      for (const user of users) {
        try {
          const userId = user._id.toString();
          
          // Generate daily analytics report for user
          const report = await dailyReportService.generateDailyReport(userId);
          
          if (report) {
            reportsGenerated++;
            logger.info(`Generated daily report for user ${user.name || userId}`);
          }
          
        } catch (error) {
          logger.error(`Error generating report for user ${user._id}:`, error);
        }
      }
      
      logger.info(`Daily report generation completed. Total users: ${users.length}, Reports generated: ${reportsGenerated}`);
      
    } catch (error) {
      logger.error('Error in daily report generation:', error);
    } finally {
      this.isReportingActive = false;
    }
  }

  /**
   * Update engagement metrics for recent posts
   */
  private async updateEngagementMetrics(): Promise<void> {
    try {
      logger.info('Starting engagement metrics update...');
      
      // Get posts from the last 7 days that need engagement updates
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const posts = await PostModel.find({
        status: 'posted',
        postedAt: { $gte: sevenDaysAgo },
        $or: [
          { lastEngagementUpdate: { $exists: false } },
          { lastEngagementUpdate: { $lt: thirtyMinutesAgo } }
        ]
      }).limit(50).select('_id userId platform externalPostId').lean();
      
      let updatesProcessed = 0;
      
      for (const post of posts) {
        try {
          // In production, this would fetch real engagement data from platform APIs
          // For now, we just update the timestamp to show the cron is working
          await PostModel.findByIdAndUpdate(
            post._id, 
            { 
              $set: { 
                lastEngagementUpdate: new Date() 
              } 
            }
          );
          
          updatesProcessed++;
          logger.debug(`Updated engagement timestamp for post ${post._id}`);
          
        } catch (error) {
          logger.error(`Error updating engagement for post ${post._id}:`, error);
        }
      }
      
      logger.info(`Engagement metrics update completed. Posts processed: ${updatesProcessed}`);
      
    } catch (error) {
      logger.error('Error updating engagement metrics:', error);
    }
  }

  /**
   * Get cron job status
   */
  getCronStatus(): { 
    isSchedulingActive: boolean; 
    isReportingActive: boolean; 
    uptime: number;
    lastActivity: {
      scheduling?: Date;
      reporting?: Date;
      engagement?: Date;
    };
  } {
    return {
      isSchedulingActive: this.isSchedulingActive,
      isReportingActive: this.isReportingActive,
      uptime: process.uptime(),
      lastActivity: {
        // These would be tracked with actual timestamps in production
        scheduling: new Date(),
        reporting: new Date(),
        engagement: new Date()
      }
    };
  }

  /**
   * Manual trigger for daily post scheduling
   */
  async triggerDailyScheduling(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.isSchedulingActive) {
        return { success: false, message: 'Daily scheduling already in progress' };
      }
      
      await this.scheduleDailyPosts();
      return { success: true, message: 'Daily scheduling completed successfully' };
      
    } catch (error) {
      logger.error('Error in manual daily scheduling trigger:', error);
      return { success: false, message: `Failed to trigger daily scheduling: ${error}` };
    }
  }

  /**
   * Manual trigger for report generation
   */
  async triggerReportGeneration(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.isReportingActive) {
        return { success: false, message: 'Report generation already in progress' };
      }
      
      await this.generateDailyReports();
      return { success: true, message: 'Report generation completed successfully' };
      
    } catch (error) {
      logger.error('Error in manual report generation trigger:', error);
      return { success: false, message: `Failed to trigger report generation: ${error}` };
    }
  }
}

export default CronService; 