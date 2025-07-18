import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';

export interface YouTubeVideoUpload {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: 'public' | 'private' | 'unlisted';
  thumbnail?: string;
}

export interface YouTubeUploadResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  error?: string;
  uploadTime?: Date;
}

export class YouTubeAPI {
  private youtube: any;
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/auth/youtube/callback'
    );

    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client
    });
  }

  /**
   * Generate YouTube OAuth URL for user authorization
   */
  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true
    });
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      logger.info('YouTube access token obtained successfully');
      
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600
      };
    } catch (error) {
      logger.error('Error getting YouTube access token:', error);
      throw new Error('Failed to get YouTube access token');
    }
  }

  /**
   * Set access token for API requests
   */
  setAccessToken(accessToken: string, refreshToken?: string): void {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }

  /**
   * Upload video to YouTube
   */
  async uploadVideo(
    videoPath: string, 
    uploadOptions: YouTubeVideoUpload
  ): Promise<YouTubeUploadResult> {
    try {
      logger.info(`Starting YouTube video upload: ${uploadOptions.title}`);

      // Validate video file exists
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      const fileSize = fs.statSync(videoPath).size;
      logger.info(`Upload file size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

      // Prepare video metadata
      const videoMetadata = {
        snippet: {
          title: uploadOptions.title,
          description: uploadOptions.description,
          tags: uploadOptions.tags || [],
          categoryId: uploadOptions.categoryId || '22', // People & Blogs
          defaultLanguage: 'en',
          defaultAudioLanguage: 'en'
        },
        status: {
          privacyStatus: uploadOptions.privacyStatus || 'public',
          embeddable: true,
          license: 'youtube',
          publicStatsViewable: true
        }
      };

      // Upload video
      const response = await this.youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: videoMetadata,
        media: {
          body: fs.createReadStream(videoPath)
        }
      });

      const videoId = response.data.id;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      logger.info(`YouTube upload successful: ${videoUrl}`);

      // Upload thumbnail if provided
      if (uploadOptions.thumbnail && fs.existsSync(uploadOptions.thumbnail)) {
        try {
          await this.uploadThumbnail(videoId, uploadOptions.thumbnail);
          logger.info('Thumbnail uploaded successfully');
        } catch (thumbnailError) {
          logger.error('Thumbnail upload failed:', thumbnailError);
          // Don't fail the entire upload for thumbnail issues
        }
      }

      return {
        success: true,
        videoId,
        videoUrl,
        uploadTime: new Date()
      };

    } catch (error: any) {
      logger.error('YouTube upload failed:', error);
      
      let errorMessage = 'Unknown upload error';
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Upload thumbnail for a video
   */
  private async uploadThumbnail(videoId: string, thumbnailPath: string): Promise<void> {
    try {
      await this.youtube.thumbnails.set({
        videoId: videoId,
        media: {
          body: fs.createReadStream(thumbnailPath)
        }
      });
      
      logger.info(`Thumbnail uploaded for video: ${videoId}`);
    } catch (error) {
      logger.error('Thumbnail upload error:', error);
      throw error;
    }
  }

  /**
   * Get video details
   */
  async getVideoDetails(videoId: string): Promise<any> {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'status'],
        id: [videoId]
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0];
      } else {
        throw new Error('Video not found');
      }
    } catch (error) {
      logger.error('Error fetching video details:', error);
      throw error;
    }
  }

  /**
   * Get channel analytics
   */
  async getChannelAnalytics(): Promise<{
    subscriberCount: number;
    totalViews: number;
    videoCount: number;
    recentVideos: any[];
  }> {
    try {
      // Get channel info
      const channelResponse = await this.youtube.channels.list({
        part: ['statistics', 'snippet'],
        mine: true
      });

      const channel = channelResponse.data.items[0];
      const stats = channel.statistics;

      // Get recent videos
      const videosResponse = await this.youtube.search.list({
        part: ['snippet'],
        forMine: true,
        type: 'video',
        order: 'date',
        maxResults: 10
      });

      return {
        subscriberCount: parseInt(stats.subscriberCount) || 0,
        totalViews: parseInt(stats.viewCount) || 0,
        videoCount: parseInt(stats.videoCount) || 0,
        recentVideos: videosResponse.data.items || []
      };
    } catch (error) {
      logger.error('Error fetching channel analytics:', error);
      return {
        subscriberCount: 0,
        totalViews: 0,
        videoCount: 0,
        recentVideos: []
      };
    }
  }

  /**
   * Check if access token is valid
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.youtube.channels.list({
        part: ['snippet'],
        mine: true
      });
      return true;
    } catch (error) {
      logger.error('YouTube token validation failed:', error);
      return false;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      
      return {
        access_token: credentials.access_token,
        expires_in: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600
      };
    } catch (error) {
      logger.error('Error refreshing YouTube access token:', error);
      throw new Error('Failed to refresh YouTube access token');
    }
  }

  /**
   * Create a YouTube Shorts video (vertical format optimization)
   */
  async uploadShorts(
    videoPath: string,
    uploadOptions: YouTubeVideoUpload
  ): Promise<YouTubeUploadResult> {
    // Add #Shorts to description for YouTube Shorts recognition
    const shortsOptions = {
      ...uploadOptions,
      description: `${uploadOptions.description}\n\n#Shorts #RealEstate #Property`,
      tags: [...(uploadOptions.tags || []), 'shorts', 'realestate', 'property']
    };

    return this.uploadVideo(videoPath, shortsOptions);
  }

  /**
   * Schedule a video upload for later
   */
  async scheduleVideo(
    videoPath: string,
    uploadOptions: YouTubeVideoUpload,
    publishTime: Date
  ): Promise<YouTubeUploadResult> {
    try {
      // Upload as private first
      const privateOptions = {
        ...uploadOptions,
        privacyStatus: 'private' as const
      };

      const result = await this.uploadVideo(videoPath, privateOptions);
      
      if (result.success && result.videoId) {
        // Note: YouTube API doesn't support scheduling directly
        // You would need to implement a job queue to publish at the specified time
        logger.info(`Video uploaded as private, scheduled for: ${publishTime.toISOString()}`);
        
        // TODO: Implement scheduling logic with job queue
        // This could use node-cron or a proper job queue like Bull
      }

      return result;
    } catch (error) {
      logger.error('Error scheduling video:', error);
      return {
        success: false,
        error: 'Failed to schedule video'
      };
    }
  }
}

// Export singleton instance
export const youtubeAPI = new YouTubeAPI(); 