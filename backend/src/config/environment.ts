import * as fs from 'fs';
import * as path from 'path';

export interface AppConfig {
  // Database
  mongoUri: string;
  mongoDatabase: string;
  
  // Instagram API
  instagramAccessToken: string;
  instagramBusinessId: string;
  instagramAppId: string;
  instagramUserId: string;
  
  // YouTube API
  youtubeApiKey: string;
  youtubeClientId: string;
  youtubeClientSecret: string;
  youtubeRefreshToken: string;
  youtubeChannelId: string;
  
  // AI Services
  openaiApiKey: string;
  
  // Storage
  dropboxApiKey: string;
  
  // App Settings
  port: number;
  nodeEnv: string;
  phase9AutopilotMode: 'off' | 'dropbox' | 'instagram' | 'both';
  maxRepostsPerDay: number;
  minDaysBetweenPosts: number;
  
  // Phase 9 Settings
  phase9Settings: {
    minPerformanceScore: number;
    repostDelay: number;
    enableYouTubeReposts: boolean;
    enableInstagramReposts: boolean;
    maxRepostsPerDay: number;
    maxRepostsPerPlatform: number;
    dailyScheduling: {
      enabled: boolean;
      scheduleTime: string;
      prepareForTomorrow: boolean;
      maxPostsPerDay: number;
      maxPostsPerPlatform: number;
      peakHoursOnly: boolean;
    };
    dropboxSync: {
      enabled: boolean;
      syncPath: string;
      filenameFormat: string;
      preventDuplicates: boolean;
    };
    contentRefresh: {
      enabled: boolean;
      refreshAfterPost: boolean;
      refreshAudio: boolean;
      refreshHashtags: boolean;
      refreshDescriptions: boolean;
    };
  };
}

class EnvironmentConfig {
  private config: AppConfig;
  private settingsPath: string;

  constructor() {
    this.settingsPath = path.join(__dirname, '../../settings.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    // In production, use environment variables
    if (process.env.NODE_ENV === 'production') {
      return this.loadFromEnvironment();
    }
    
    // In development, try to load from settings.json first, then fall back to environment
    try {
      if (fs.existsSync(this.settingsPath)) {
        const settingsData = fs.readFileSync(this.settingsPath, 'utf8');
        const settings = JSON.parse(settingsData);
        return this.convertSettingsToConfig(settings);
      }
    } catch (error) {
      console.warn('⚠️ Could not load settings.json, using environment variables');
    }
    
    return this.loadFromEnvironment();
  }

  private loadFromEnvironment(): AppConfig {
    return {
      // Database
      mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/lifestyle-design-auto-poster',
      mongoDatabase: process.env.MONGO_DATABASE || 'lifestyle-design-auto-poster',
      
      // Instagram API
      instagramAccessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
      instagramBusinessId: process.env.INSTAGRAM_BUSINESS_ID || '',
      instagramAppId: process.env.INSTAGRAM_APP_ID || '',
      instagramUserId: process.env.INSTAGRAM_USER_ID || '',
      
      // YouTube API
      youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
      youtubeClientId: process.env.YOUTUBE_CLIENT_ID || '',
      youtubeClientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      youtubeRefreshToken: process.env.YOUTUBE_REFRESH_TOKEN || '',
      youtubeChannelId: process.env.YOUTUBE_CHANNEL_ID || '',
      
      // AI Services
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      
      // Storage
      dropboxApiKey: process.env.DROPBOX_API_KEY || '',
      
      // App Settings
      port: parseInt(process.env.PORT || '3001'),
      nodeEnv: process.env.NODE_ENV || 'development',
      phase9AutopilotMode: (process.env.PHASE9_AUTOPILOT_MODE as any) || 'both',
      maxRepostsPerDay: parseInt(process.env.MAX_REPOSTS_PER_DAY || '8'),
      minDaysBetweenPosts: parseInt(process.env.MIN_DAYS_BETWEEN_POSTS || '20'),
      
      // Phase 9 Settings
      phase9Settings: {
        minPerformanceScore: parseInt(process.env.MIN_PERFORMANCE_SCORE || '1000'),
        repostDelay: parseInt(process.env.REPOST_DELAY || '1'),
        enableYouTubeReposts: process.env.ENABLE_YOUTUBE_REPOSTS !== 'false',
        enableInstagramReposts: process.env.ENABLE_INSTAGRAM_REPOSTS !== 'false',
        maxRepostsPerDay: parseInt(process.env.MAX_REPOSTS_PER_DAY || '8'),
        maxRepostsPerPlatform: parseInt(process.env.MAX_REPOSTS_PER_PLATFORM || '4'),
        dailyScheduling: {
          enabled: process.env.DAILY_SCHEDULING_ENABLED !== 'false',
          scheduleTime: process.env.DAILY_SCHEDULE_TIME || '0 2 * * *',
          prepareForTomorrow: process.env.PREPARE_FOR_TOMORROW !== 'false',
          maxPostsPerDay: parseInt(process.env.MAX_POSTS_PER_DAY || '8'),
          maxPostsPerPlatform: parseInt(process.env.MAX_POSTS_PER_PLATFORM || '4'),
          peakHoursOnly: process.env.PEAK_HOURS_ONLY !== 'false'
        },
        dropboxSync: {
          enabled: process.env.DROPBOX_SYNC_ENABLED !== 'false',
          syncPath: process.env.DROPBOX_SYNC_PATH || '/SyncedInstagramPosts/',
          filenameFormat: process.env.DROPBOX_FILENAME_FORMAT || 'YYYY-MM-DD_CaptionSnippet.mp4',
          preventDuplicates: process.env.PREVENT_DUPLICATES !== 'false'
        },
        contentRefresh: {
          enabled: process.env.CONTENT_REFRESH_ENABLED !== 'false',
          refreshAfterPost: process.env.REFRESH_AFTER_POST !== 'false',
          refreshAudio: process.env.REFRESH_AUDIO !== 'false',
          refreshHashtags: process.env.REFRESH_HASHTAGS !== 'false',
          refreshDescriptions: process.env.REFRESH_DESCRIPTIONS !== 'false'
        }
      }
    };
  }

  private convertSettingsToConfig(settings: any): AppConfig {
    return {
      // Database
      mongoUri: settings.mongoUri || 'mongodb://localhost:27017/lifestyle-design-auto-poster',
      mongoDatabase: settings.mongoDatabase || 'lifestyle-design-auto-poster',
      
      // Instagram API
      instagramAccessToken: settings.instagramAccessToken || '',
      instagramBusinessId: settings.instagramBusinessId || '',
      instagramAppId: settings.instagramAppId || '',
      instagramUserId: settings.instagramUserId || '',
      
      // YouTube API
      youtubeApiKey: settings.youtubeApiKey || '',
      youtubeClientId: settings.youtubeClientId || '',
      youtubeClientSecret: settings.youtubeClientSecret || '',
      youtubeRefreshToken: settings.youtubeRefreshToken || '',
      youtubeChannelId: settings.youtubeChannelId || '',
      
      // AI Services
      openaiApiKey: settings.openaiApiKey || '',
      
      // Storage
      dropboxApiKey: settings.dropboxApiKey || '',
      
      // App Settings
      port: parseInt(process.env.PORT || '3001'),
      nodeEnv: process.env.NODE_ENV || 'development',
      phase9AutopilotMode: settings.phase9AutopilotMode || settings.autopostMode || 'both',
      maxRepostsPerDay: settings.phase9Settings?.maxRepostsPerDay || 8,
      minDaysBetweenPosts: settings.minDaysBetweenPosts || 20,
      
      // Phase 9 Settings
      phase9Settings: {
        minPerformanceScore: settings.phase9Settings?.minPerformanceScore || 1000,
        repostDelay: settings.phase9Settings?.repostDelay || 1,
        enableYouTubeReposts: settings.phase9Settings?.enableYouTubeReposts !== false,
        enableInstagramReposts: settings.phase9Settings?.enableInstagramReposts !== false,
        maxRepostsPerDay: settings.phase9Settings?.maxRepostsPerDay || 8,
        maxRepostsPerPlatform: settings.phase9Settings?.maxRepostsPerPlatform || 4,
        dailyScheduling: {
          enabled: settings.phase9Settings?.dailyScheduling?.enabled !== false,
          scheduleTime: settings.phase9Settings?.dailyScheduling?.scheduleTime || '0 2 * * *',
          prepareForTomorrow: settings.phase9Settings?.dailyScheduling?.prepareForTomorrow !== false,
          maxPostsPerDay: settings.phase9Settings?.dailyScheduling?.maxPostsPerDay || 8,
          maxPostsPerPlatform: settings.phase9Settings?.dailyScheduling?.maxPostsPerPlatform || 4,
          peakHoursOnly: settings.phase9Settings?.dailyScheduling?.peakHoursOnly !== false
        },
        dropboxSync: {
          enabled: settings.phase9Settings?.dropboxSync?.enabled !== false,
          syncPath: settings.phase9Settings?.dropboxSync?.syncPath || '/SyncedInstagramPosts/',
          filenameFormat: settings.phase9Settings?.dropboxSync?.filenameFormat || 'YYYY-MM-DD_CaptionSnippet.mp4',
          preventDuplicates: settings.phase9Settings?.dropboxSync?.preventDuplicates !== false
        },
        contentRefresh: {
          enabled: settings.phase9Settings?.contentRefresh?.enabled !== false,
          refreshAfterPost: settings.phase9Settings?.contentRefresh?.refreshAfterPost !== false,
          refreshAudio: settings.phase9Settings?.contentRefresh?.refreshAudio !== false,
          refreshHashtags: settings.phase9Settings?.contentRefresh?.refreshHashtags !== false,
          refreshDescriptions: settings.phase9Settings?.contentRefresh?.refreshDescriptions !== false
        }
      }
    };
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public get(key: keyof AppConfig): any {
    return this.config[key];
  }

  public updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // In development, also update settings.json
    if (process.env.NODE_ENV !== 'production') {
      try {
        const currentSettings = fs.existsSync(this.settingsPath) 
          ? JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'))
          : {};
        
        const updatedSettings = { ...currentSettings, ...updates };
        fs.writeFileSync(this.settingsPath, JSON.stringify(updatedSettings, null, 2));
      } catch (error) {
        console.warn('⚠️ Could not update settings.json:', error);
      }
    }
  }

  public validateConfig(): { valid: boolean; missing: string[] } {
    const required = [
      'instagramAccessToken',
      'instagramBusinessId',
      'youtubeApiKey',
      'youtubeClientId',
      'youtubeClientSecret',
      'youtubeRefreshToken',
      'openaiApiKey'
    ];

    const missing = required.filter(key => !this.config[key as keyof AppConfig]);
    
    return {
      valid: missing.length === 0,
      missing
    };
  }
}

// Export singleton instance
export const appConfig = new EnvironmentConfig();
export default appConfig;