import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export interface YouTubeUploadOptions {
  videoPath: string;
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacy?: 'private' | 'public' | 'unlisted';
  thumbnailPath?: string;
}

export interface YouTubeUploadResult {
  success: boolean;
  videoId?: string;
  url?: string;
  error?: string;
  uploadDetails?: {
    title: string;
    description: string;
    publishedAt: string;
    viewCount: number;
    channelId: string;
  };
}

/**
 * Real YouTube upload using Google YouTube Data API v3
 */
export class RealYouTubeUploader {
  private youtube;
  private oauth2Client;
  
  constructor(
    private apiKey: string,
    private clientId: string, 
    private clientSecret: string,
    private refreshToken: string
  ) {
    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:8080/oauth2callback'
    );
    
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    // Initialize YouTube API client
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client
    });
  }

  /**
   * Upload video to YouTube
   */
  async uploadVideo(options: YouTubeUploadOptions): Promise<YouTubeUploadResult> {
    try {
      console.log('🎬 Starting real YouTube upload...');
      console.log(`   Title: ${options.title}`);
      console.log(`   Description: ${options.description.substring(0, 100)}...`);
      console.log(`   Video file: ${options.videoPath}`);

      // Check if video file exists
      if (!fs.existsSync(options.videoPath)) {
        throw new Error(`Video file not found: ${options.videoPath}`);
      }

      const fileSize = fs.statSync(options.videoPath).size;
      console.log(`   File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      // Prepare video metadata
      const videoMetadata = {
        snippet: {
          title: options.title,
          description: options.description,
          tags: options.tags || [],
          categoryId: options.categoryId || '22', // People & Blogs category
          defaultLanguage: 'en',
          defaultAudioLanguage: 'en'
        },
        status: {
          privacyStatus: options.privacy || 'public',
          selfDeclaredMadeForKids: false
        }
      };

      console.log('📤 Uploading to YouTube...');

      // Upload video
      const uploadResponse = await this.youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: videoMetadata,
        media: {
          body: fs.createReadStream(options.videoPath)
        }
      });

      const videoId = uploadResponse.data.id;
      if (!videoId) {
        throw new Error('Upload successful but no video ID returned');
      }

      console.log(`✅ Upload successful! Video ID: ${videoId}`);

      // Get video details
      const videoDetails = await this.youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: [videoId]
      });

      const video = videoDetails.data.items?.[0];
      const snippet = video?.snippet;
      const statistics = video?.statistics;

      const result: YouTubeUploadResult = {
        success: true,
        videoId: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        uploadDetails: {
          title: snippet?.title || options.title,
          description: snippet?.description || options.description,
          publishedAt: snippet?.publishedAt || new Date().toISOString(),
          viewCount: parseInt(statistics?.viewCount || '0'),
          channelId: snippet?.channelId || ''
        }
      };

      // Upload thumbnail if provided
      if (options.thumbnailPath && fs.existsSync(options.thumbnailPath)) {
        try {
          console.log('🖼️ Uploading custom thumbnail...');
          await this.youtube.thumbnails.set({
            videoId: videoId,
            media: {
              body: fs.createReadStream(options.thumbnailPath)
            }
          });
          console.log('✅ Thumbnail uploaded successfully');
        } catch (thumbnailError) {
          console.warn('⚠️ Thumbnail upload failed:', thumbnailError);
        }
      }

      console.log('🎉 YouTube upload complete!');
      console.log(`   Video URL: ${result.url}`);
      
      return result;

    } catch (error: any) {
      console.error('❌ YouTube upload failed:', error);
      
      let errorMessage = 'Unknown upload error';
      if (error?.response?.data?.error) {
        errorMessage = `YouTube API Error: ${error.response.data.error.message}`;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(): Promise<any> {
    try {
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics'],
        mine: true
      });
      
      return response.data.items?.[0];
    } catch (error) {
      console.error('❌ Error getting channel info:', error);
      throw error;
    }
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<{ success: boolean; channelTitle?: string; error?: string }> {
    try {
      const channel = await this.getChannelInfo();
      return {
        success: true,
        channelTitle: channel?.snippet?.title
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Connection test failed'
      };
    }
  }
}

/**
 * Factory function to create YouTube uploader from settings
 */
export function createYouTubeUploader(settings: any): RealYouTubeUploader {
  return new RealYouTubeUploader(
    settings.youtubeApiKey,
    settings.youtubeClientId, 
    settings.youtubeClientSecret,
    settings.youtubeRefreshToken
  );
}