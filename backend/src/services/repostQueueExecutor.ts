import * as cron from 'node-cron';
import { RepostQueue, IRepostQueue } from '../models/RepostQueue';
import { Phase9DualPlatformReposter } from '../lib/youtube/phase9DualPlatformReposter';

export class RepostQueueExecutor {
  private reposter: Phase9DualPlatformReposter;
  private executorJob: any;
  private isRunning: boolean = false;

  constructor() {
    this.reposter = new Phase9DualPlatformReposter();
  }

  /**
   * Start the repost queue executor
   * Checks every minute for posts that should be executed
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ RepostQueue executor is already running');
      return;
    }

    // Run every minute to check for scheduled posts
    this.executorJob = cron.schedule('* * * * *', async () => {
      await this.executeScheduledPosts();
    });

    this.executorJob.start();
    this.isRunning = true;
    console.log('🚀 RepostQueue executor started - checking every minute');
  }

  /**
   * Stop the repost queue executor
   */
  stop(): void {
    if (this.executorJob) {
      this.executorJob.destroy();
      this.isRunning = false;
      console.log('🛑 RepostQueue executor stopped');
    }
  }

  /**
   * Execute posts that are scheduled for now or past due
   */
  private async executeScheduledPosts(): Promise<void> {
    try {
      const now = new Date();
      
      // Find posts that are scheduled for now or past due
      const duePosts = await RepostQueue.find({
        status: 'queued',
        scheduledFor: { $lte: now }
      }).sort({ scheduledFor: 1 }).limit(5); // Process max 5 at a time

      if (duePosts.length === 0) {
        return; // No posts due for execution
      }

      console.log(`⏰ Found ${duePosts.length} posts ready for execution`);

      for (const post of duePosts) {
        await this.executePost(post);
      }

    } catch (error) {
      console.error('❌ Error in RepostQueue executor:', error);
    }
  }

  /**
   * Execute a single repost
   */
  private async executePost(post: IRepostQueue): Promise<void> {
    try {
      console.log(`🎬 Executing ${post.targetPlatform} post: ${post.sourceMediaId}`);
      
      // Update status to processing
      await RepostQueue.findByIdAndUpdate(post._id, {
        status: 'processing',
        processedAt: new Date()
      });

      // Execute based on target platform
      let result;
      if (post.targetPlatform === 'youtube') {
        result = await this.reposter.processYouTubeRepost(post);
      } else if (post.targetPlatform === 'instagram') {
        result = await this.reposter.processInstagramRepost(post);
      } else {
        throw new Error(`Unknown target platform: ${post.targetPlatform}`);
      }

      if (result.success) {
        // Update to completed
        await RepostQueue.findByIdAndUpdate(post._id, {
          status: 'completed',
          completedAt: new Date(),
          resultData: {
            uploadedVideoId: result.videoId,
            uploadedUrl: result.url,
            platform: post.targetPlatform
          }
        });
        
        console.log(`✅ Successfully posted to ${post.targetPlatform}: ${result.videoId}`);
      } else {
        throw new Error(result.error || 'Unknown posting error');
      }

    } catch (error) {
      console.error(`❌ Failed to execute post ${post.sourceMediaId}:`, error);
      
      // Update to failed
      await RepostQueue.findByIdAndUpdate(post._id, {
        status: 'failed',
        failedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get executor status
   */
  getStatus(): { isRunning: boolean; nextCheck?: Date } {
    return {
      isRunning: this.isRunning,
      nextCheck: this.isRunning ? new Date(Date.now() + 60000) : undefined // Next minute
    };
  }
}

// Create singleton instance
export const repostQueueExecutor = new RepostQueueExecutor(); 