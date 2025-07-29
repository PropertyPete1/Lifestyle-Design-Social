import * as cron from 'node-cron';
import { YouTubeScraper } from './youtubeScraper';
import { InstagramScraper } from './instagramScraper';
import * as fs from 'fs';
import * as path from 'path';

export class DailyHashtagRefreshService {
  private refreshJob: cron.ScheduledTask | null = null;

  /**
   * Start daily hashtag refresh scheduler
   * Runs every day at 3 AM to refresh hashtag data
   */
  start(): void {
    console.log('🔄 Starting daily hashtag refresh scheduler...');
    
    this.refreshJob = cron.schedule('0 3 * * *', async () => {
      console.log('🌅 Daily hashtag refresh triggered at:', new Date());
      await this.performDailyRefresh();
    });

    console.log('✅ Daily hashtag refresh scheduler started (runs at 3 AM daily)');
  }

  /**
   * Stop the daily refresh scheduler
   */
  stop(): void {
    if (this.refreshJob) {
      this.refreshJob.stop();
      this.refreshJob = null;
      console.log('❌ Daily hashtag refresh scheduler stopped');
    }
  }

  /**
   * Load credentials from settings.json
   */
  private loadCredentials() {
    try {
      const settingsPath = path.resolve(__dirname, '../../settings.json');
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        return {
          youtube: {
            apiKey: settings.youtubeApiKey,
            channelId: settings.youtubeChannelId,
            refreshToken: settings.youtubeRefreshToken
          },
          instagram: {
            accessToken: settings.instagramAccessToken,
            pageId: settings.instagramBusinessId
          }
        };
      }
    } catch (error) {
      console.warn('Could not load credentials from settings.json:', error);
    }
    return null;
  }

  /**
   * Perform daily hashtag refresh by scraping latest content
   */
  async performDailyRefresh(): Promise<void> {
    try {
      console.log('🚀 Starting daily hashtag refresh process...');

      const credentials = this.loadCredentials();
      if (!credentials) {
        console.error('❌ No credentials found for daily refresh');
        return;
      }

      let refreshResults = {
        youtube: { success: false, hashtagsUpdated: 0 },
        instagram: { success: false, hashtagsUpdated: 0 },
        totalUpdated: 0
      };

      // Refresh YouTube hashtags if credentials available
      if (credentials.youtube?.apiKey && credentials.youtube?.channelId) {
        try {
          console.log('📺 Refreshing YouTube hashtag data...');
          const ytScraper = new YouTubeScraper(
            credentials.youtube.apiKey,
            credentials.youtube.channelId,
            credentials.youtube.refreshToken
          );

          // Scrape top performing videos to update hashtag trends
          const videos = await ytScraper.scrapeTopPerformingVideos();
          refreshResults.youtube = {
            success: true,
            hashtagsUpdated: videos.length
          };
          
          console.log(`✅ YouTube: ${refreshResults.youtube.hashtagsUpdated} hashtags updated`);
        } catch (ytError) {
          console.error('❌ YouTube hashtag refresh failed:', ytError);
          refreshResults.youtube = { success: false, hashtagsUpdated: 0 };
        }
      }

      // Refresh Instagram hashtags if credentials available
      if (credentials.instagram?.accessToken && credentials.instagram?.pageId) {
        try {
          console.log('📸 Refreshing Instagram hashtag data...');
          const igScraper = new InstagramScraper(
            credentials.instagram.accessToken,
            credentials.instagram.pageId
          );

          // Scrape Instagram content to update hashtag trends
          const content = await igScraper.scrapeTopPerformingVideos();
          refreshResults.instagram = {
            success: true,
            hashtagsUpdated: content.length
          };
          
          console.log(`✅ Instagram: ${refreshResults.instagram.hashtagsUpdated} hashtags updated`);
        } catch (igError) {
          console.error('❌ Instagram hashtag refresh failed:', igError);
          refreshResults.instagram = { success: false, hashtagsUpdated: 0 };
        }
      }

      refreshResults.totalUpdated = refreshResults.youtube.hashtagsUpdated + refreshResults.instagram.hashtagsUpdated;

      console.log(`🎉 Daily hashtag refresh completed! Total hashtags updated: ${refreshResults.totalUpdated}`);
      
      // Log refresh activity to settings for tracking
      await this.logRefreshActivity(refreshResults);

    } catch (error) {
      console.error('❌ Daily hashtag refresh error:', error);
    }
  }

  /**
   * Log refresh activity to track daily refresh performance
   */
  private async logRefreshActivity(results: any): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date(),
        type: 'daily_hashtag_refresh',
        results: results
      };

      const logPath = path.resolve(__dirname, '../../logs/hashtag_refresh.log');
      const logDir = path.dirname(logPath);
      
      // Ensure logs directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Append log entry
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.warn('Could not log refresh activity:', error);
    }
  }

  /**
   * Manually trigger hashtag refresh (for testing)
   */
  async triggerManualRefresh(): Promise<any> {
    console.log('🔧 Manual hashtag refresh triggered');
    await this.performDailyRefresh();
    return { success: true, message: 'Manual hashtag refresh completed' };
  }
}

// Export singleton instance
export const dailyHashtagRefresh = new DailyHashtagRefreshService(); 