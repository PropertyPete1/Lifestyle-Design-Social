import { logger } from '../utils/logger';
import { InstagramService } from './instagramService';
import { TikTokService } from './tiktokService';
import { YouTubeService } from './youtubeService';
import { CaptionGenerationService } from './captionGenerationService';
import { VideoProcessingService } from './videoProcessingService';
import { UserModel } from '../models/User';
import { pool } from '../config/database';

export interface PlatformConfig {
  instagram: boolean;
  tiktok: boolean;
  youtube: boolean;
}

export interface MultiPlatformPostOptions {
  videoPath: string;
  userId: string;
  platforms: PlatformConfig;
  caption?: string;
  hashtags?: string[];
  title?: string;
  description?: string;
  tags?: string[];
  privacyLevel?: 'public' | 'unlisted' | 'private';
  category?: string;
  tone?: 'professional' | 'casual' | 'funny' | 'luxury';
}

export interface MultiPlatformPostResult {
  success: boolean;
  results: {
    instagram?: any;
    tiktok?: any;
    youtube?: any;
  };
  errors: string[];
  totalEngagement: number;
}

export interface PlatformRequirements {
  instagram: {
    maxDuration: number;
    maxFileSize: number;
    recommendedDimensions: { width: number; height: number };
    recommendedBitrate: number;
  };
  tiktok: {
    maxDuration: number;
    maxFileSize: number;
    recommendedDimensions: { width: number; height: number };
    recommendedBitrate: number;
  };
  youtube: {
    maxDuration: number;
    maxFileSize: number;
    recommendedDimensions: { width: number; height: number };
    recommendedBitrate: number;
  };
}

export class MultiPlatformService {
  private instagramService: InstagramService;
  private tiktokService: TikTokService;
  private youtubeService: YouTubeService;
  private captionService: CaptionGenerationService;
  private videoService: VideoProcessingService;
  private userModel: UserModel;

  constructor() {
    this.instagramService = new InstagramService();
    this.tiktokService = new TikTokService();
    this.youtubeService = new YouTubeService();
    this.captionService = new CaptionGenerationService();
    this.videoService = new VideoProcessingService();
    this.userModel = new UserModel(pool);
  }

  /**
   * Post video to multiple platforms
   */
  async postToMultiplePlatforms(options: MultiPlatformPostOptions): Promise<MultiPlatformPostResult> {
    try {
      logger.info(`Posting video to multiple platforms for user ${options.userId}`);

      const user = await this.userModel.findById(options.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const results: any = {};
      const errors: string[] = [];
      let totalEngagement = 0;

      // Process video for each platform
      const processedVideos = await this.processVideoForPlatforms(options.videoPath, options.platforms);

      // Post to Instagram
      if (options.platforms.instagram && user.instagramAccessToken) {
        try {
          const instagramCaption = await this.generatePlatformCaption('instagram', options);
          const instagramResult = await this.instagramService.postVideo({
            videoPath: processedVideos.instagram || options.videoPath,
            caption: instagramCaption.caption,
            hashtags: instagramCaption.hashtags,
            accessToken: user.instagramAccessToken,
            userId: options.userId,
          });

          if (instagramResult.success) {
            results.instagram = instagramResult;
            totalEngagement += this.calculateEngagement(instagramResult.engagementMetrics);
          } else {
            errors.push(`Instagram: ${instagramResult.error}`);
          }
        } catch (error) {
          errors.push(`Instagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Post to TikTok
      if (options.platforms.tiktok && user.tiktokAccessToken) {
        try {
          const tiktokCaption = await this.generatePlatformCaption('tiktok', options);
          const tiktokResult = await this.tiktokService.postVideo({
            videoPath: processedVideos.tiktok || options.videoPath,
            caption: tiktokCaption.caption,
            hashtags: tiktokCaption.hashtags,
            accessToken: user.tiktokAccessToken,
            userId: options.userId,
          });

          if (tiktokResult.success) {
            results.tiktok = tiktokResult;
            totalEngagement += this.calculateEngagement(tiktokResult.engagementMetrics);
          } else {
            errors.push(`TikTok: ${tiktokResult.error}`);
          }
        } catch (error) {
          errors.push(`TikTok: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Post to YouTube
      if (options.platforms.youtube && user.youtubeAccessToken) {
        try {
          const youtubeContent = await this.generateYouTubeContent(options);
          const youtubeResult = await this.youtubeService.postVideo({
            videoPath: processedVideos.youtube || options.videoPath,
            title: youtubeContent.title,
            description: youtubeContent.description,
            tags: youtubeContent.tags,
            accessToken: user.youtubeAccessToken,
            userId: options.userId,
          });

          if (youtubeResult.success) {
            results.youtube = youtubeResult;
            totalEngagement += this.calculateEngagement(youtubeResult.engagementMetrics);
          } else {
            errors.push(`YouTube: ${youtubeResult.error}`);
          }
        } catch (error) {
          errors.push(`YouTube: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const success = Object.keys(results).length > 0;

      logger.info(`Multi-platform posting completed. Success: ${success}, Errors: ${errors.length}`);

      return {
        success,
        results,
        errors,
        totalEngagement,
      };
    } catch (error) {
      logger.error('Failed to post to multiple platforms:', error);
      return {
        success: false,
        results: {},
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        totalEngagement: 0,
      };
    }
  }

  /**
   * Process video for different platforms
   */
  private async processVideoForPlatforms(videoPath: string, platforms: PlatformConfig): Promise<Record<string, string>> {
    const processedVideos: Record<string, string> = {};

    // Instagram processing (1:1 aspect ratio)
    if (platforms.instagram) {
      try {
        const instagramSettings = this.instagramService.getInstagramVideoSettings();
        const result = await this.videoService.processVideo(videoPath, 'system', {
          compressVideo: true,
          generateThumbnail: true,
          maxDuration: instagramSettings.maxDuration,
          maxFileSize: instagramSettings.maxFileSize,
        });
        processedVideos.instagram = result.processedFilePath || videoPath;
      } catch (error) {
        logger.error('Failed to process video for Instagram:', error);
        processedVideos.instagram = videoPath;
      }
    }

    // TikTok processing (9:16 aspect ratio)
    if (platforms.tiktok) {
      try {
        const tiktokSettings = this.tiktokService.getVideoRequirements();
        const result = await this.videoService.processVideo(videoPath, 'system', {
          compressVideo: true,
          generateThumbnail: true,
          maxDuration: tiktokSettings.maxDuration,
          maxFileSize: tiktokSettings.maxFileSize,
        });
        processedVideos.tiktok = result.processedFilePath || videoPath;
      } catch (error) {
        logger.error('Failed to process video for TikTok:', error);
        processedVideos.tiktok = videoPath;
      }
    }

    // YouTube processing (9:16 for Shorts)
    if (platforms.youtube) {
      try {
        const youtubeSettings = this.youtubeService.getVideoRequirements();
        const result = await this.videoService.processVideo(videoPath, 'system', {
          compressVideo: true,
          generateThumbnail: true,
          maxDuration: youtubeSettings.maxDuration,
          maxFileSize: youtubeSettings.maxFileSize,
        });
        processedVideos.youtube = result.processedFilePath || videoPath;
      } catch (error) {
        logger.error('Failed to process video for YouTube:', error);
        processedVideos.youtube = videoPath;
      }
    }

    return processedVideos;
  }

  /**
   * Generate platform-specific captions
   */
  private async generatePlatformCaption(platform: string, options: MultiPlatformPostOptions): Promise<{ caption: string; hashtags: string[] }> {
    if (options.caption) {
      return {
        caption: options.caption,
        hashtags: options.hashtags || [],
      };
    }

    // Generate platform-specific caption
    const captionOptions = {
      videoId: 'temp', // Will be replaced with actual video ID
      tone: options.tone || 'professional',
      includeHashtags: true,
      maxLength: this.getPlatformMaxLength(platform),
      includeEmojis: true,
    };

    const generatedCaption = await this.captionService.generateCaption(captionOptions);
    
    // Add platform-specific hashtags
    const platformHashtags = this.getPlatformHashtags(platform, options.category || 'real-estate');
    const allHashtags = [...generatedCaption.hashtags, ...platformHashtags];

    return {
      caption: generatedCaption.caption,
      hashtags: allHashtags.slice(0, this.getPlatformHashtagLimit(platform)),
    };
  }

  /**
   * Generate YouTube-specific content
   */
  private async generateYouTubeContent(options: MultiPlatformPostOptions): Promise<{ title: string; description: string; tags: string[] }> {
    const baseCaption = options.caption || 'Amazing real estate content!';
    const category = options.category || 'real-estate';

    const title = this.youtubeService.generateYouTubeTitle(baseCaption, category);
    const description = this.youtubeService.generateYouTubeDescription(baseCaption, options.hashtags || []);
    const tags = this.youtubeService.generateYouTubeTags(category);

    return { title, description, tags };
  }

  /**
   * Get platform-specific maximum caption length
   */
  private getPlatformMaxLength(platform: string): number {
    const maxLengths: Record<string, number> = {
      instagram: 2200,
      tiktok: 150,
      youtube: 5000,
    };
    return maxLengths[platform] || 2200;
  }

  /**
   * Get platform-specific hashtag limits
   */
  private getPlatformHashtagLimit(platform: string): number {
    const limits: Record<string, number> = {
      instagram: 30,
      tiktok: 20,
      youtube: 15,
    };
    return limits[platform] || 30;
  }

  /**
   * Get platform-specific hashtags
   */
  private getPlatformHashtags(platform: string, category: string): string[] {
    const platformHashtags: Record<string, Record<string, string[]>> = {
      instagram: {
        'real-estate': ['#realestate', '#luxuryhomes', '#property'],
        'cartoon': ['#realestatehumor', '#realtorlife', '#funny'],
      },
      tiktok: {
        'real-estate': ['#realestate', '#luxuryhomes', '#property', '#fyp', '#foryou'],
        'cartoon': ['#realestatehumor', '#realtorlife', '#funny', '#fyp', '#foryou'],
      },
      youtube: {
        'real-estate': ['#realestate', '#luxuryhomes', '#property'],
        'cartoon': ['#realestatehumor', '#realtorlife', '#funny'],
      },
    };

    return platformHashtags[platform]?.[category] || [];
  }

  /**
   * Calculate total engagement from metrics
   */
  private calculateEngagement(metrics: any): number {
    if (!metrics) return 0;
    
    return (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0) + (metrics.views || 0) / 100;
  }

  /**
   * Get platform requirements
   */
  getPlatformRequirements(): PlatformRequirements {
    return {
      instagram: this.instagramService.getInstagramVideoSettings(),
      tiktok: this.tiktokService.getVideoRequirements(),
      youtube: this.youtubeService.getVideoRequirements(),
    };
  }

  /**
   * Validate platform credentials
   */
  async validatePlatformCredentials(userId: string): Promise<Record<string, boolean>> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const validations: Record<string, boolean> = {};

      if (user.instagramAccessToken) {
        validations.instagram = await this.instagramService.validateCredentials(user.instagramAccessToken);
      }

      if (user.tiktokAccessToken) {
        validations.tiktok = await this.tiktokService.validateCredentials(user.tiktokAccessToken);
      }

      if (user.youtubeAccessToken) {
        validations.youtube = await this.youtubeService.validateCredentials(user.youtubeAccessToken);
      }

      return validations;
    } catch (error) {
      logger.error('Failed to validate platform credentials:', error);
      return {};
    }
  }

  /**
   * Get optimal posting times for all platforms
   */
  async getOptimalPostingTimes(userId: string): Promise<Record<string, string[]>> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const times: Record<string, string[]> = {};

      if (user.instagramAccessToken) {
        times.instagram = await this.instagramService.getOptimalPostingTimes(user.instagramAccessToken);
      }

      if (user.tiktokAccessToken) {
        times.tiktok = await this.tiktokService.getOptimalPostingTimes(user.tiktokAccessToken);
      }

      if (user.youtubeAccessToken) {
        times.youtube = await this.youtubeService.getOptimalPostingTimes(user.youtubeAccessToken);
      }

      return times;
    } catch (error) {
      logger.error('Failed to get optimal posting times:', error);
      return {};
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats(userId: string): Promise<Record<string, any>> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const stats: Record<string, any> = {};

      if (user.instagramAccessToken) {
        try {
          const accountInfo = await this.instagramService.getAccountInfo(user.instagramAccessToken);
          stats.instagram = accountInfo;
        } catch (error) {
          logger.error('Failed to get Instagram stats:', error);
        }
      }

      if (user.tiktokAccessToken) {
        try {
          const accountInfo = await this.tiktokService.getAccountInfo(user.tiktokAccessToken);
          stats.tiktok = accountInfo;
        } catch (error) {
          logger.error('Failed to get TikTok stats:', error);
        }
      }

      if (user.youtubeAccessToken) {
        try {
          const accountInfo = await this.youtubeService.getAccountInfo(user.youtubeAccessToken);
          stats.youtube = accountInfo;
        } catch (error) {
          logger.error('Failed to get YouTube stats:', error);
        }
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get platform stats:', error);
      return {};
    }
  }
}

export default MultiPlatformService; 