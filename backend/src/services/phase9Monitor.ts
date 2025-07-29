import { Phase9InstagramScraper } from '../lib/youtube/phase9InstagramScraper';
import { Phase9DualPlatformReposter } from '../lib/youtube/phase9DualPlatformReposter';
import { Phase9DailyScheduler } from '../lib/youtube/phase9DailyScheduler';
import * as fs from 'fs';
import * as path from 'path';
import * as cron from 'node-cron';

export class Phase9Monitor {
  private isRunning: boolean = false;
  private scrapingJob?: any;
  private processingJob?: any;
  private settingsPath: string;
  private dualPlatformReposter: Phase9DualPlatformReposter;
  private dailyScheduler: Phase9DailyScheduler;

  constructor() {
    this.settingsPath = path.join(__dirname, '../../settings.json');
    this.dualPlatformReposter = new Phase9DualPlatformReposter();
    this.dailyScheduler = new Phase9DailyScheduler();
  }

  /**
   * Start Phase 9 monitoring based on settings
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 Phase 9 Monitor: Starting intelligent dual-platform automation...');

      const settings = this.loadSettings();
      const phase9AutopilotMode = settings.phase9AutopilotMode || 'off';

      if (phase9AutopilotMode === 'off') {
        console.log('📴 Phase 9 auto-posting is OFF');
        return;
      }

      // Start daily scheduling system
      await this.dailyScheduler.startDailyScheduling();

      if (phase9AutopilotMode === 'both' || phase9AutopilotMode === 'instagram') {
        console.log('🚀 Phase 9: Dual-platform mode activated - Instagram scraping + both platform repurposing');
        await this.startDualPlatformMode(settings);
      } else if (phase9AutopilotMode === 'dropbox') {
        console.log('📂 Phase 9: Dropbox mode activated - monitoring uploads only');
        await this.startDropboxMode(settings);
      }

      this.isRunning = true;
      console.log('✅ Phase 9 Monitor: Successfully started with dual-platform automation');

    } catch (error) {
      console.error('❌ Phase 9 Monitor: Failed to start:', error);
      throw error;
    }
  }

  /**
   * Stop Phase 9 monitoring
   */
  stop(): void {
    console.log('🛑 Phase 9 Monitor: Stopping...');

    if (this.scrapingJob) {
      this.scrapingJob.stop();
      this.scrapingJob = undefined;
    }

    if (this.processingJob) {
      this.processingJob.stop();
      this.processingJob = undefined;
    }

    this.dailyScheduler.stopDailyScheduling();

    this.isRunning = false;
    console.log('✅ Phase 9 Monitor: Stopped');
  }

  /**
   * Start dual-platform mode - scrape Instagram and repost to both platforms
   */
  private async startDualPlatformMode(settings: any): Promise<void> {
    console.log('🚀 Initializing dual-platform intelligent repurposing mode...');

    // Validate credentials for both platforms
    if (!settings.instagramAccessToken || !settings.instagramBusinessId) {
      throw new Error('Instagram access token and business ID required for dual-platform mode');
    }

    if (!settings.youtubeRefreshToken || !settings.youtubeClientId) {
      throw new Error('YouTube credentials required for dual-platform mode');
    }

    // Create service instances
    const scraper = new Phase9InstagramScraper(
      settings.instagramAccessToken,
      settings.instagramBusinessId
    );

    // Set up Instagram scraping schedule - every 2 hours
    this.scrapingJob = cron.schedule('0 */2 * * *', async () => {
      try {
        console.log('⏰ Phase 9 Scheduled: Starting Instagram content scraping...');
        const scrapingResult = await scraper.scrapeRecentPosts();
        
        if (scrapingResult.success) {
          console.log(`✅ Scraping completed: ${scrapingResult.postsScraped} posts, ${scrapingResult.topPerformers} top performers`);
          
          // Schedule new content for the week
          await this.dailyScheduler.scheduleRestOfWeek();
        } else {
          console.error(`❌ Scraping failed: ${scrapingResult.error}`);
        }
      } catch (error) {
        console.error('❌ Phase 9 Scraping Job Error:', error);
      }
    });

    // Set up dual-platform repost processing - every 15 minutes for real-time posting
    this.processingJob = cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('⏰ Phase 9 Scheduled: Processing dual-platform reposts...');
        
        // Process both Instagram and YouTube reposts
        const dualResults = await this.dualPlatformReposter.processDualPlatformReposts();
        
        console.log(`🚀 Dual-platform processing: ${dualResults.successful}/${dualResults.processed} successful`);
        console.log(`   📱 Instagram: ${dualResults.instagram.successful} successful, ${dualResults.instagram.failed} failed`);
        console.log(`   📺 YouTube: ${dualResults.youtube.successful} successful, ${dualResults.youtube.failed} failed`);

        if (dualResults.errors.length > 0) {
          console.warn('⚠️ Some reposts failed:', dualResults.errors);
        }

        // Clean up old scheduled posts
        await this.dailyScheduler.cleanupOldScheduledPosts();

      } catch (error) {
        console.error('❌ Phase 9 Dual-Platform Processing Job Error:', error);
      }
    });

    // Run initial scraping and scheduling
    console.log('🔄 Running initial Instagram content scraping and weekly scheduling...');
    const initialResult = await scraper.scrapeRecentPosts();
    if (initialResult.success) {
      console.log(`✅ Initial scraping: ${initialResult.postsScraped} posts processed, ${initialResult.topPerformers} top performers identified`);
      
      // Schedule posts for the rest of the week
      const weekScheduleResult = await this.dailyScheduler.scheduleRestOfWeek();
      if (weekScheduleResult.success) {
        console.log(`📅 Week scheduling: ${weekScheduleResult.scheduledPosts} posts scheduled across both platforms`);
      }
    }

    console.log('✅ Dual-platform mode fully initialized with automatic scheduling and processing');
  }

  /**
   * Start Dropbox mode - monitor uploads but no Instagram scraping
   */
  private async startDropboxMode(settings: any): Promise<void> {
    console.log('📂 Initializing Dropbox monitoring mode...');

    // In Dropbox mode, we still process any existing reposts but don't scrape new content
    // Set up processing schedule - every hour (less frequent than dual-platform mode)
    this.processingJob = cron.schedule('0 * * * *', async () => {
      try {
        console.log('⏰ Phase 9 Dropbox Mode: Processing existing reposts...');
        
        // Process any pending reposts
        const dualResults = await this.dualPlatformReposter.processDualPlatformReposts();

        if (dualResults.processed > 0) {
          console.log(`📊 Processed reposts - Total: ${dualResults.successful}/${dualResults.processed} successful`);
          console.log(`   📱 Instagram: ${dualResults.instagram.successful}/${dualResults.instagram.successful + dualResults.instagram.failed}`);
          console.log(`   📺 YouTube: ${dualResults.youtube.successful}/${dualResults.youtube.successful + dualResults.youtube.failed}`);
        }

      } catch (error) {
        console.error('❌ Phase 9 Dropbox Mode Processing Error:', error);
      }
    });

    console.log('✅ Dropbox mode initialized - monitoring existing reposts only');
  }

  /**
   * Load settings from environment variables or file fallback
   */
  private loadSettings(): any {
    try {
      // Use environment variables first (for production), fallback to file
      const settings = {
        autopostMode: process.env.AUTOPOST_MODE || 'both',
        phase9AutopilotMode: process.env.PHASE9_AUTOPILOT_MODE || 'both',
        instagramAccessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
        instagramBusinessId: process.env.INSTAGRAM_BUSINESS_ID || '',
        youtubeRefreshToken: process.env.YOUTUBE_REFRESH_TOKEN || '',
        youtubeClientId: process.env.YOUTUBE_CLIENT_ID || '',
        youtubeClientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
        youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
        youtubeChannelId: process.env.YOUTUBE_CHANNEL_ID || '',
        maxRepostsPerDay: parseInt(process.env.MAX_REPOSTS_PER_DAY || '8'),
        minDaysBetweenPosts: parseInt(process.env.MIN_DAYS_BETWEEN_POSTS || '30')
      };

      // If environment variables are set, use them
      if (settings.instagramAccessToken && settings.instagramBusinessId) {
        return settings;
      }

      // Otherwise, try to load from file (development mode)
      const settingsData = fs.readFileSync(this.settingsPath, 'utf8');
      const fileSettings = JSON.parse(settingsData);
      
      // Merge environment and file settings (env takes precedence)
      return { ...fileSettings, ...settings };
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      return { autopostMode: 'off' };
    }
  }

  /**
   * Update auto-posting mode
   */
  async updatePhase9AutopilotMode(mode: 'off' | 'dropbox' | 'instagram' | 'both'): Promise<void> {
    try {
      console.log(`🔄 Phase 9: Updating autopost mode to "${mode}"`);

      // Load current settings
      const settings = this.loadSettings();
      settings.phase9AutopilotMode = mode;

      // Save updated settings
      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));

      // Restart monitoring with new mode
      if (this.isRunning) {
        this.stop();
        await this.start();
      }

      console.log(`✅ Phase 9: Autopost mode updated to "${mode}"`);

    } catch (error) {
      console.error('❌ Failed to update autopost mode:', error);
      throw error;
    }
  }

  /**
   * Get current Phase 9 status and comprehensive statistics
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    phase9AutopilotMode: string;
    scraperStats?: any;
    dualPlatformStats?: any;
    schedulingStats?: any;
    nextScraping?: string;
    nextProcessing?: string;
  }> {
    try {
      const settings = this.loadSettings();
      const phase9AutopilotMode = settings.phase9AutopilotMode || 'off';

      const status: any = {
        isRunning: this.isRunning,
        phase9AutopilotMode
      };

      // Add detailed stats if running
      if (this.isRunning) {
        try {
          // Get scraper stats if in Instagram mode
          if (phase9AutopilotMode === 'both' || phase9AutopilotMode === 'instagram') {
            const scraper = new Phase9InstagramScraper(
              settings.instagramAccessToken,
              settings.instagramBusinessId
            );
            status.scraperStats = await scraper.getScrapingStats();
            status.nextScraping = 'Every 2 hours';
            status.nextProcessing = 'Every 15 minutes';
          } else {
            status.nextProcessing = 'Every hour (Dropbox mode)';
          }

          // Get dual-platform stats
          status.dualPlatformStats = await this.dualPlatformReposter.getDualPlatformStats();

          // Get scheduling stats
          status.schedulingStats = await this.dailyScheduler.getSchedulingStats();

        } catch (error) {
          console.warn('⚠️ Could not fetch detailed stats:', error);
        }
      }

      return status;

    } catch (error) {
      console.error('❌ Error getting Phase 9 status:', error);
      return {
        isRunning: false,
        phase9AutopilotMode: 'off'
      };
    }
  }

  /**
   * Manually trigger Instagram content scraping
   */
  async triggerManualScraping(): Promise<any> {
    try {
      console.log('🔄 Phase 9: Manual scraping triggered...');

      const settings = this.loadSettings();
      if (!settings.instagramAccessToken || !settings.instagramBusinessId) {
        throw new Error('Instagram credentials not configured');
      }

      const scraper = new Phase9InstagramScraper(
        settings.instagramAccessToken,
        settings.instagramBusinessId
      );

      const result = await scraper.scrapeRecentPosts();
      console.log(`✅ Manual scraping completed: ${result.postsScraped} posts, ${result.topPerformers} top performers`);

      // Schedule new content for the week
      if (result.success && result.topPerformers > 0) {
        const weekScheduleResult = await this.dailyScheduler.scheduleRestOfWeek();
        // Add scheduling result to the response
        (result as any).weekScheduleResult = weekScheduleResult;
      }

      return result;

    } catch (error) {
      console.error('❌ Manual scraping failed:', error);
      throw error;
    }
  }

  /**
   * Manually trigger dual-platform reposting
   */
  async triggerManualReposting(): Promise<any> {
    try {
      console.log('🔄 Phase 9: Manual dual-platform reposting triggered...');

      const result = await this.dualPlatformReposter.processDualPlatformReposts();

      console.log(`✅ Manual reposting completed: ${result.successful}/${result.processed} successful`);
      console.log(`   📱 Instagram: ${result.instagram.successful} successful, ${result.instagram.failed} failed`);
      console.log(`   📺 YouTube: ${result.youtube.successful} successful, ${result.youtube.failed} failed`);

      return result;

    } catch (error) {
      console.error('❌ Manual reposting failed:', error);
      throw error;
    }
  }

  /**
   * Manually trigger weekly scheduling
   */
  async triggerWeeklyScheduling(): Promise<any> {
    try {
      console.log('📅 Phase 9: Manual weekly scheduling triggered...');

      const result = await this.dailyScheduler.scheduleRestOfWeek();
      console.log(`✅ Weekly scheduling completed: ${result.scheduledPosts} posts scheduled`);

      return result;

    } catch (error) {
      console.error('❌ Weekly scheduling failed:', error);
      throw error;
    }
  }

  /**
   * Clean up placeholder and test data from database
   */
  async cleanupPlaceholderData(): Promise<{ success: boolean; deletedCounts: any }> {
    try {
      console.log('🧹 Phase 9: Cleaning up placeholder and test data...');

      const { InstagramArchive } = require('../models/InstagramContent');
      const { RepostQueue } = require('../models/RepostQueue');
      const { VideoStatus } = require('../models/VideoStatus');

      const deletedCounts = {
        instagramArchive: 0,
        repostQueue: 0,
        videoStatus: 0
      };

      // Clean up test Instagram content
      const instagramCleanup = await InstagramArchive.deleteMany({
        $or: [
          { caption: { $regex: /test|placeholder|mock|sample/i } },
          { videoId: { $regex: /test|placeholder|mock|sample/i } },
          { performanceScore: { $lt: 10 } }, // Very low scores are likely test data
          { viewCount: 0, likeCount: 0, commentCount: 0 } // Zero engagement is likely test
        ]
      });
      deletedCounts.instagramArchive = instagramCleanup.deletedCount;

      // Clean up test repost queue entries
      const repostCleanup = await RepostQueue.deleteMany({
        $or: [
          { sourceMediaId: { $regex: /test|placeholder|mock|sample/i } },
          { status: 'failed', createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Old failed entries
        ]
      });
      deletedCounts.repostQueue = repostCleanup.deletedCount;

      // Clean up test video status entries
      const videoStatusCleanup = await VideoStatus.deleteMany({
        $or: [
          { videoId: { $regex: /test|placeholder|mock|sample/i } },
          { filename: { $regex: /test|placeholder|mock|sample/i } },
          { status: 'failed', uploadDate: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        ]
      });
      deletedCounts.videoStatus = videoStatusCleanup.deletedCount;

      console.log('✅ Placeholder data cleanup complete:');
      console.log(`   📱 Instagram Archive: ${deletedCounts.instagramArchive} entries deleted`);
      console.log(`   🔄 Repost Queue: ${deletedCounts.repostQueue} entries deleted`);
      console.log(`   📹 Video Status: ${deletedCounts.videoStatus} entries deleted`);

      return {
        success: true,
        deletedCounts
      };

    } catch (error) {
      console.error('❌ Failed to cleanup placeholder data:', error);
      return {
        success: false,
        deletedCounts: {}
      };
    }
  }

  /**
   * Update Phase 9 settings
   */
  async updatePhase9Settings(newSettings: any): Promise<void> {
    try {
      console.log('🔄 Phase 9: Updating settings...');

      const settings = this.loadSettings();
      settings.phase9Settings = {
        ...settings.phase9Settings,
        ...newSettings
      };

      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
      console.log('✅ Phase 9: Settings updated');

    } catch (error) {
      console.error('❌ Failed to update Phase 9 settings:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const phase9Monitor = new Phase9Monitor(); 