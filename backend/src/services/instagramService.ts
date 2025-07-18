import { logger } from '../utils/logger';

export interface InstagramPostOptions {
  userId: string;
  videoPath: string;
  caption: string;
  hashtags: string[];
  accessToken: string;
}

export interface InstagramPostResult {
  success: boolean;
  postId?: string;
  permalink?: string;
  error?: string;
  engagementMetrics?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    reach: number;
    impressions: number;
  };
}

export class InstagramService {
  private readonly GRAPH_API_VERSION = 'v18.0';
  private readonly BASE_URL = 'https://graph.facebook.com';

  /**
   * Post video to Instagram using Graph API
   */
  async postVideo(options: InstagramPostOptions): Promise<InstagramPostResult> {
    try {
      logger.info(`Posting video to Instagram for user ${options.userId}`);

      if (!options.accessToken) {
        throw new Error('Instagram access token required');
      }

      const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        throw new Error('Instagram Business Account ID not configured');
      }

      // Step 1: Create media object
      const mediaResponse = await fetch(
        `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${businessAccountId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_url: options.videoPath,
            caption: `${options.caption}\n\n${options.hashtags.join(' ')}`,
            access_token: options.accessToken,
          }),
        }
      );

      const mediaData = await mediaResponse.json();

      if (mediaData.error) {
        throw new Error(`Instagram API Error: ${mediaData.error.message}`);
      }

      // Step 2: Publish the media
      const publishResponse = await fetch(
        `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${businessAccountId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: mediaData.id,
            access_token: options.accessToken,
          }),
        }
      );

      const publishData = await publishResponse.json();

      if (publishData.error) {
        throw new Error(`Instagram Publish Error: ${publishData.error.message}`);
      }

      logger.info(`Successfully posted to Instagram: ${publishData.id}`);
      return {
        success: true,
        postId: publishData.id,
        permalink: `https://www.instagram.com/p/${publishData.id}/`,
      };
    } catch (error) {
      logger.error('Failed to post to Instagram:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get Instagram account information
   */
  async getAccountInfo(accessToken: string): Promise<any> {
    try {
      logger.info('Getting Instagram account info');

      const response = await fetch(
        `${this.BASE_URL}/${this.GRAPH_API_VERSION}/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram API Error: ${data.error.message}`);
      }

      return {
        id: data.id,
        username: data.username,
        accountType: data.account_type,
        mediaCount: data.media_count,
        connected: true,
      };
    } catch (error) {
      logger.error('Failed to get Instagram account info:', error);
      return null;
    }
  }

  /**
   * Refresh Instagram access token
   */
  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      logger.info('Refreshing Instagram access token');

      const response = await fetch(
        `${this.BASE_URL}/oauth/access_token?grant_type=ig_refresh_token&access_token=${refreshToken}`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram Token Refresh Error: ${data.error.message}`);
      }

      return data.access_token;
    } catch (error) {
      logger.error('Failed to refresh Instagram token:', error);
      return null;
    }
  }

  /**
   * Get Instagram media for a user
   */
  async getMedia(accessToken: string, limit: number = 20): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.GRAPH_API_VERSION}/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram API Error: ${data.error.message}`);
      }

      return data.data || [];
    } catch (error) {
      logger.error('Failed to get Instagram media:', error);
      throw error;
    }
  }

  /**
   * Get Instagram insights for a specific post
   */
  async getInsights(accessToken: string, postId: string): Promise<any> {
    try {
      logger.info(`Getting Instagram insights for post: ${postId}`);

      const response = await fetch(
        `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${postId}/insights?metric=impressions,reach,likes,comments,shares,saves&access_token=${accessToken}`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram Insights Error: ${data.error.message}`);
      }

      const insights = data.data.reduce((acc: any, metric: any) => {
        acc[metric.name] = metric.values[0]?.value || 0;
        return acc;
      }, {});

      return {
        likes: insights.likes || 0,
        comments: insights.comments || 0,
        shares: insights.shares || 0,
        saves: insights.saves || 0,
        reach: insights.reach || 0,
        impressions: insights.impressions || 0,
        apiConfigured: true,
      };
    } catch (error) {
      logger.error('Failed to get Instagram insights:', error);
      return null;
    }
  }

  /**
   * Get optimal posting times based on audience insights
   */
  async getOptimalPostingTimes(accessToken: string): Promise<string[]> {
    try {
      const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        throw new Error('Instagram Business Account ID not configured');
      }

      const response = await fetch(
        `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${businessAccountId}/insights?metric=audience_city,audience_country,audience_gender_age,audience_locale&period=lifetime&access_token=${accessToken}`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram Audience Insights Error: ${data.error.message}`);
      }

      // Analyze audience data to determine optimal posting times
      // This is a simplified implementation - real analysis would be more complex
      const defaultTimes = ['09:00', '12:00', '15:00', '18:00', '21:00'];
      return defaultTimes;
    } catch (error) {
      logger.error('Failed to analyze Instagram optimal posting times:', error);
      return ['09:00', '18:00']; // Fallback times
    }
  }

  /**
   * Check Instagram API status and connectivity
   */
  async checkApiStatus(): Promise<boolean> {
    try {
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!accessToken) {
        logger.warn('Instagram access token not configured');
        return false;
      }

      const response = await fetch(
        `${this.BASE_URL}/${this.GRAPH_API_VERSION}/me?access_token=${accessToken}`
      );
      const data = await response.json();

      if (data.error) {
        logger.error('Instagram API status check failed:', data.error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Instagram API status check failed:', error);
      return false;
    }
  }

  /**
   * Validate Instagram credentials
   */
  async validateCredentials(accessToken?: string): Promise<boolean> {
    if (!accessToken) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.GRAPH_API_VERSION}/me?access_token=${accessToken}`
      );
      const data = await response.json();

      if (data.error) {
        logger.error('Instagram credentials validation failed:', data.error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Instagram credentials validation error:', error);
      return false;
    }
  }
}

// Add missing interface
export interface InstagramAccountInfo {
  id: string;
  username: string;
  accountType?: string;
  mediaCount?: number;
  followersCount?: number;
}

// Create and export default instance
const instagramService = new InstagramService();
export default instagramService;
