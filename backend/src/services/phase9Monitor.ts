import { Phase9InstagramScraper } from '../lib/youtube/phase9InstagramScraper';
import { Phase9YouTubeReposter } from '../lib/youtube/phase9YouTubeReposter';
import { Phase9InstagramReposter } from '../lib/youtube/phase9InstagramReposter';
import fs from 'fs';
import path from 'path';
import * as cron from 'node-cron';

export class Phase9Monitor {
  private isRunning: boolean = false;
  private scrapingJob?: any;
  private processingJob?: any;
  private settingsPath: string;

  constructor() {
    this.settingsPath = path.join(__dirname, '../../settings.json');
  }

  /**
   * Start Phase 9 monitoring based on settings
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 Phase 9 Monitor: Starting intelligent content repurposing...');

      const settings = this.loadSettings();
      const autopostMode = settings.autopostMode || 'off';

      if (autopostMode === 'off') {
        console.log('📴 Phase 9 auto-posting is OFF');
        return;
      }

      if (autopostMode === 'instagram') {
        console.log('📱 Phase 9: Instagram mode activated - scraping and repurposing content');
        await this.startInstagramMode(settings);
      } else if (autopostMode === 'dropbox') {
        console.log('📂 Phase 9: Dropbox mode activated - monitoring uploads only');
        await this.startDropboxMode(settings);
      }

      this.isRunning = true;
      console.log('✅ Phase 9 Monitor: Successfully started');

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

    this.isRunning = false;
    console.log('✅ Phase 9 Monitor: Stopped');
  }

  /**
   * Start Instagram mode - scrape and repost content automatically
   */
  private async startInstagramMode(settings: any): Promise<void> {
    console.log('📱 Initializing Instagram intelligent repurposing mode...');

    // Validate Instagram settings
    if (!settings.instagramAccessToken || !settings.instagramBusinessId) {
      throw new Error('Instagram access token and business ID required for Instagram mode');
    }

    // Create service instances
    const scraper = new Phase9InstagramScraper(
      settings.instagramAccessToken,
      settings.instagramBusinessId
    );
    const youtubeReposter = new Phase9YouTubeReposter();
    const instagramReposter = new Phase9InstagramReposter(
      settings.instagramAccessToken,
      settings.instagramBusinessId
    );

    // Set up scraping schedule - every 2 hours
    this.scrapingJob = cron.schedule('0 */2 * * *', async () => {
      try {
        console.log('⏰ Phase 9 Scheduled: Starting Instagram content scraping...');
        const scrapingResult = await scraper.scrapeRecentPosts();
        
        if (scrapingResult.success) {
          console.log(`✅ Scraping completed: ${scrapingResult.postsScraped} posts, ${scrapingResult.topPerformers} top performers`);
        } else {
          console.error(`❌ Scraping failed: ${scrapingResult.error}`);
        }
      } catch (error) {
        console.error('❌ Phase 9 Scraping Job Error:', error);
      }
    });

    // Set up repost processing - every 30 minutes
    this.processingJob = cron.schedule('*/30 * * * *', async () => {
      try {
        console.log('⏰ Phase 9 Scheduled: Processing reposts...');
        
        // Process YouTube reposts
        const youtubeResults = await youtubeReposter.processYouTubeReposts();
        console.log(`📺 YouTube reposts: ${youtubeResults.successful}/${youtubeResults.processed} successful`);

        // Process Instagram reposts  
        const instagramResults = await instagramReposter.processInstagramReposts();
        console.log(`📱 Instagram reposts: ${instagramResults.successful}/${instagramResults.processed} successful`);

        if (youtubeResults.errors.length > 0 || instagramResults.errors.length > 0) {
          console.warn('⚠️ Some reposts failed:', [...youtubeResults.errors, ...instagramResults.errors]);
        }

      } catch (error) {
        console.error('❌ Phase 9 Repost Processing Job Error:', error);
      }
    });

    // Run initial scraping
    console.log('🔄 Running initial Instagram content scraping...');
    const initialResult = await scraper.scrapeRecentPosts();
    if (initialResult.success) {
      console.log(`✅ Initial scraping: ${initialResult.postsScraped} posts processed, ${initialResult.topPerformers} top performers identified`);
    }

    console.log('✅ Instagram mode fully initialized with automatic scheduling');
  }

  /**
   * Start Dropbox mode - monitor uploads but no Instagram scraping
   */
  private async startDropboxMode(settings: any): Promise<void> {
    console.log('📂 Initializing Dropbox monitoring mode...');

    // In Dropbox mode, we still process any existing reposts but don't scrape new content
    const youtubeReposter = new Phase9YouTubeReposter();
    const instagramReposter = new Phase9InstagramReposter(
      settings.instagramAccessToken || '',
      settings.instagramBusinessId || ''
    );

    // Set up processing schedule - every hour (less frequent than Instagram mode)
    this.processingJob = cron.schedule('0 * * * *', async () => {
      try {
        console.log('⏰ Phase 9 Dropbox Mode: Processing existing reposts...');
        
        // Process any pending reposts
        const youtubeResults = await youtubeReposter.processYouTubeReposts();
        const instagramResults = await instagramReposter.processInstagramReposts();

        if (youtubeResults.processed > 0 || instagramResults.processed > 0) {
          console.log(`📊 Processed reposts - YouTube: ${youtubeResults.successful}/${youtubeResults.processed}, Instagram: ${instagramResults.successful}/${instagramResults.processed}`);
        }

      } catch (error) {
        console.error('❌ Phase 9 Dropbox Mode Processing Error:', error);
      }
    });

    console.log('✅ Dropbox mode initialized - monitoring existing reposts only');
  }

  /**
   * Load settings from file
   */
  private loadSettings(): any {
    try {
      const settingsData = fs.readFileSync(this.settingsPath, 'utf8');
      return JSON.parse(settingsData);
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      return { autopostMode: 'off' };
    }
  }

  /**
   * Update auto-posting mode
   */
  async updateAutopostMode(mode: 'off' | 'dropbox' | 'instagram'): Promise<void> {
    try {
      console.log(`🔄 Phase 9: Updating autopost mode to "${mode}"`);

      // Load current settings
      const settings = this.loadSettings();
      settings.autopostMode = mode;

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
   * Get current Phase 9 status and statistics
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    autopostMode: string;
    scraperStats?: any;
    youtubeStats?: any;
    instagramStats?: any;
    nextScraping?: string;
    nextProcessing?: string;
  }> {
    try {
      const settings = this.loadSettings();
      const autopostMode = settings.autopostMode || 'off';

      const status: any = {
        isRunning: this.isRunning,
        autopostMode
      };

      // Add detailed stats if running in Instagram mode
      if (autopostMode === 'instagram' && this.isRunning) {
        try {
          const scraper = new Phase9InstagramScraper(
            settings.instagramAccessToken,
            settings.instagramBusinessId
          );
          status.scraperStats = await scraper.getScrapingStats();

          const youtubeReposter = new Phase9YouTubeReposter();
          status.youtubeStats = await youtubeReposter.getYouTubeRepostStats();

          const instagramReposter = new Phase9InstagramReposter(
            settings.instagramAccessToken,
            settings.instagramBusinessId
          );
          status.instagramStats = await instagramReposter.getInstagramRepostStats();

          // Add schedule info
          status.nextScraping = 'Every 2 hours';
          status.nextProcessing = 'Every 30 minutes';

        } catch (error) {
          console.warn('⚠️ Could not fetch detailed stats:', error);
        }
      }

      return status;

    } catch (error) {
      console.error('❌ Error getting Phase 9 status:', error);
      return {
        isRunning: false,
        autopostMode: 'off'
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

      return result;

    } catch (error) {
      console.error('❌ Manual scraping failed:', error);
      throw error;
    }
  }

  /**
   * Manually trigger repost processing
   */
  async triggerManualReposting(): Promise<any> {
    try {
      console.log('🔄 Phase 9: Manual reposting triggered...');

      const settings = this.loadSettings();
      const youtubeReposter = new Phase9YouTubeReposter();
      const instagramReposter = new Phase9InstagramReposter(
        settings.instagramAccessToken || '',
        settings.instagramBusinessId || ''
      );

      const [youtubeResults, instagramResults] = await Promise.all([
        youtubeReposter.processYouTubeReposts(),
        instagramReposter.processInstagramReposts()
      ]);

      const result = {
        youtube: youtubeResults,
        instagram: instagramResults,
        totalProcessed: youtubeResults.processed + instagramResults.processed,
        totalSuccessful: youtubeResults.successful + instagramResults.successful,
        totalFailed: youtubeResults.failed + instagramResults.failed
      };

      console.log(`✅ Manual reposting completed: ${result.totalSuccessful}/${result.totalProcessed} successful`);
      return result;

    } catch (error) {
      console.error('❌ Manual reposting failed:', error);
      throw error;
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