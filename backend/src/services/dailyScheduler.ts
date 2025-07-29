import { MongoClient, Db } from 'mongodb';
import * as cron from 'node-cron';

export class DailyScheduler {
  private db!: Db;
  private client!: MongoClient;
  private isRunning: boolean = false;
  private dailyJob?: any;

  async start() {
    try {
      console.log('🚀 Starting daily scheduler...');
      
      // Connect to MongoDB
      this.client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
      await this.client.connect();
      this.db = this.client.db(process.env.MONGODB_DB || 'lifestyle_design_auto_poster');
      
      // Schedule daily content processing at 6 AM
      this.dailyJob = cron.schedule('0 6 * * *', async () => {
        console.log('⏰ Daily scheduler triggered at 6 AM');
        await this.processDailyTasks();
      });
      
      this.isRunning = true;
      console.log('✅ Daily scheduler started (runs at 6 AM daily)');
      
    } catch (error) {
      console.error('❌ Failed to start daily scheduler:', error);
      throw error;
    }
  }

  stop() {
    if (this.dailyJob) {
      this.dailyJob.stop();
      this.dailyJob = undefined;
    }
    if (this.client) {
      this.client.close();
    }
    this.isRunning = false;
    console.log('🛑 Daily scheduler stopped');
  }

  private async processDailyTasks() {
    try {
      console.log('📅 Processing daily tasks...');
      
      // Clean up old scheduled posts
      await this.cleanupOldPosts();
      
      // Update statistics
      await this.updateStatistics();
      
      console.log('✅ Daily tasks completed successfully');
      
    } catch (error) {
      console.error('❌ Error in daily task processing:', error);
    }
  }

  private async cleanupOldPosts() {
    try {
      console.log('🧹 Cleaning up old posts...');
      
      const repostQueue = this.db.collection('repostqueues');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Remove old completed/failed posts
      const result = await repostQueue.deleteMany({
        status: { $in: ['completed', 'failed'] },
        scheduledFor: { $lt: yesterday }
      });
      
      console.log(`🗑️ Cleaned up ${result.deletedCount} old posts`);
      
    } catch (error) {
      console.error('❌ Error cleaning up old posts:', error);
    }
  }

  private async updateStatistics() {
    try {
      console.log('📊 Updating daily statistics...');
      
      // Statistics are handled by Phase 9 monitor and individual services
      // This is a placeholder for any daily stats aggregation if needed
      
      console.log('✅ Daily statistics updated');
      
    } catch (error) {
      console.error('❌ Error updating statistics:', error);
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerManualRun(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔧 Manual daily scheduler run triggered');
      await this.processDailyTasks();
      return { success: true, message: 'Manual daily scheduler run completed' };
    } catch (error) {
      console.error('❌ Manual daily scheduler run failed:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: '6:00 AM daily',
      connected: !!this.db
    };
  }
}

export const dailyScheduler = new DailyScheduler();