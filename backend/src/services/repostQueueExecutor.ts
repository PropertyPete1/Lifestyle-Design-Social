import * as cron from 'node-cron';
import { RepostQueue, IRepostQueue } from '../models/RepostQueue';
import { Phase9YouTubeReposter } from '../lib/youtube/phase9YouTubeReposter';
import { Phase9InstagramReposter } from '../lib/youtube/phase9InstagramReposter';

export class RepostQueueExecutor {
  private youtubeReposter: Phase9YouTubeReposter;
  private instagramReposter: Phase9InstagramReposter;
  private executorJob: any;
  private isRunning: boolean = false;

  constructor() {
    this.youtubeReposter = new Phase9YouTubeReposter();
    
    // Get Instagram credentials from settings file
    const settings = this.loadSettings();
    const instagramToken = settings.instagramAccessToken || '';
    const instagramBusinessId = settings.instagramBusinessId || '';
    this.instagramReposter = new Phase9InstagramReposter(instagramToken, instagramBusinessId);
  }

  private loadSettings(): any {
    try {
      const fs = require('fs');
      const path = require('path');
      const settingsPath = path.join(__dirname, '../../settings.json');
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(settingsData);
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      return {};
    }
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
        // Process single YouTube repost
        const youtubeResult = await this.youtubeReposter.processYouTubeReposts();
        
        if (youtubeResult.successful > 0) {
          // Update to completed
          await RepostQueue.findByIdAndUpdate(post._id, {
            status: 'completed',
            completedAt: new Date(),
            resultData: {
              uploadedVideoId: 'youtube_repost',
              uploadedUrl: 'pending_youtube_upload',
              platform: post.targetPlatform,
              processed: youtubeResult.processed,
              successful: youtubeResult.successful,
              failed: youtubeResult.failed
            }
          });
          
          console.log(`✅ Successfully processed YouTube repost for ${post.sourceMediaId}: ${youtubeResult.successful}/${youtubeResult.processed} successful`);
        } else {
          throw new Error(`YouTube repost failed: ${youtubeResult.errors.join(', ') || 'Unknown error'}`);
        }
        
      } else if (post.targetPlatform === 'instagram') {
        // Process single Instagram repost  
        const instagramResult = await this.instagramReposter.processInstagramReposts();
        
        if (instagramResult.successful > 0) {
          // Update to completed
          await RepostQueue.findByIdAndUpdate(post._id, {
            status: 'completed',
            completedAt: new Date(),
            resultData: {
              uploadedVideoId: 'instagram_repost',
              uploadedUrl: 'pending_instagram_upload',
              platform: post.targetPlatform,
              processed: instagramResult.processed,
              successful: instagramResult.successful,
              failed: instagramResult.failed
            }
          });
          
          console.log(`✅ Successfully processed Instagram repost for ${post.sourceMediaId}: ${instagramResult.successful}/${instagramResult.processed} successful`);
        } else {
          throw new Error(`Instagram repost failed: ${instagramResult.errors.join(', ') || 'Unknown error'}`);
        }
        
      } else {
        throw new Error(`Unknown target platform: ${post.targetPlatform}`);
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