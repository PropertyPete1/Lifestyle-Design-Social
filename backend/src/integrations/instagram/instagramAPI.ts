// ========================================
// Instagram API Integration Service
// ========================================

import axios from 'axios';
import { logger } from '../../utils/logger';

export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  insights?: {
    impressions: number;
    reach: number;
    engagement: number;
  };
}

export interface InstagramAccount {
  id: string;
  username: string;
  account_type: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
  media_count: number;
  followers_count?: number;
  follows_count?: number;
}

export interface InstagramAuthTokens {
  access_token: string;
  token_type: 'bearer';
  expires_in?: number;
  user_id?: string;
}

export class InstagramAPI {
  private baseURL = 'https://graph.instagram.com';
  private authURL = 'https://api.instagram.com/oauth';
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  /**
   * Generate Instagram OAuth authorization URL
   */
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'user_profile,user_media',
      response_type: 'code',
      ...(state && { state })
    });

    return `${this.authURL}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<InstagramAuthTokens> {
    try {
      const response = await axios.post(`${this.authURL}/access_token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      logger.info('Instagram token exchange successful');
      return response.data;
    } catch (error) {
      logger.error('Instagram token exchange failed:', error);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Get long-lived access token
   */
  async getLongLivedToken(shortLivedToken: string): Promise<InstagramAuthTokens> {
    try {
      const response = await axios.get(`${this.baseURL}/access_token`, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: this.clientSecret,
          access_token: shortLivedToken
        }
      });

      logger.info('Instagram long-lived token obtained');
      return response.data;
    } catch (error) {
      logger.error('Failed to get long-lived token:', error);
      throw new Error('Failed to get long-lived token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(accessToken: string): Promise<InstagramAuthTokens> {
    try {
      const response = await axios.get(`${this.baseURL}/refresh_access_token`, {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken
        }
      });

      logger.info('Instagram token refreshed');
      return response.data;
    } catch (error) {
      logger.error('Failed to refresh token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get user account information
   */
  async getAccountInfo(accessToken: string): Promise<InstagramAccount> {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        params: {
          fields: 'id,username,account_type,media_count,followers_count,follows_count',
          access_token: accessToken
        }
      });

      logger.info('Instagram account info retrieved');
      return response.data;
    } catch (error) {
      logger.error('Failed to get account info:', error);
      throw new Error('Failed to get account information');
    }
  }

  /**
   * Get user's media posts
   */
  async getUserMedia(accessToken: string, options: {
    limit?: number;
    after?: string;
    before?: string;
    fields?: string[];
  } = {}): Promise<{ data: InstagramPost[]; paging?: any }> {
    try {
      const fields = options.fields || [
        'id',
        'caption',
        'media_type',
        'media_url',
        'permalink',
        'timestamp',
        'like_count',
        'comments_count'
      ];

      const params: any = {
        fields: fields.join(','),
        access_token: accessToken
      };

      if (options.limit) params.limit = options.limit;
      if (options.after) params.after = options.after;
      if (options.before) params.before = options.before;

      const response = await axios.get(`${this.baseURL}/me/media`, { params });

      logger.info(`Retrieved ${response.data.data.length} Instagram posts`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get user media:', error);
      throw new Error('Failed to get user media');
    }
  }

  /**
   * Get media insights (for business accounts)
   */
  async getMediaInsights(mediaId: string, accessToken: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/${mediaId}/insights`, {
        params: {
          metric: 'impressions,reach,engagement',
          access_token: accessToken
        }
      });

      logger.info(`Retrieved insights for media ${mediaId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get media insights:', error);
      // Don't throw error for insights as it's not available for all account types
      return null;
    }
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getAccountInfo(accessToken);
      return true;
    } catch (error) {
      logger.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Create a container for posting media
   */
  async createMediaContainer(accessToken: string, mediaData: {
    image_url?: string;
    video_url?: string;
    caption?: string;
    media_type?: 'IMAGE' | 'VIDEO';
  }): Promise<{ id: string }> {
    try {
      const params: any = {
        access_token: accessToken
      };

      if (mediaData.image_url) {
        params.image_url = mediaData.image_url;
      } else if (mediaData.video_url) {
        params.video_url = mediaData.video_url;
        params.media_type = 'VIDEO';
      }

      if (mediaData.caption) {
        params.caption = mediaData.caption;
      }

      const response = await axios.post(`${this.baseURL}/me/media`, null, { params });

      logger.info('Instagram media container created');
      return response.data;
    } catch (error) {
      logger.error('Failed to create media container:', error);
      throw new Error('Failed to create media container');
    }
  }

  /**
   * Publish media container
   */
  async publishMedia(accessToken: string, creationId: string): Promise<{ id: string }> {
    try {
      const response = await axios.post(`${this.baseURL}/me/media_publish`, null, {
        params: {
          creation_id: creationId,
          access_token: accessToken
        }
      });

      logger.info('Instagram media published');
      return response.data;
    } catch (error) {
      logger.error('Failed to publish media:', error);
      throw new Error('Failed to publish media');
    }
  }

  /**
   * Get hashtag information
   */
  async getHashtagInfo(hashtag: string, accessToken: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/ig_hashtag_search`, {
        params: {
          user_id: 'me',
          q: hashtag,
          access_token: accessToken
        }
      });

      logger.info(`Retrieved hashtag info for #${hashtag}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get hashtag info:', error);
      throw new Error('Failed to get hashtag information');
    }
  }

  /**
   * Analyze user's posting patterns for Instagram Learning
   */
  async analyzeUserContent(accessToken: string, options: {
    postCount?: number;
    includeInsights?: boolean;
  } = {}): Promise<{
    posts: InstagramPost[];
    analysis: {
      totalPosts: number;
      avgCaptionLength: number;
      commonHashtags: string[];
      topPerformingPosts: InstagramPost[];
      postingFrequency: any;
      engagementPatterns: any;
    };
  }> {
    try {
      const { postCount = 50, includeInsights = true } = options;

      // Get user's recent posts
      const mediaResponse = await this.getUserMedia(accessToken, {
        limit: postCount,
        fields: [
          'id',
          'caption',
          'media_type',
          'media_url',
          'permalink',
          'timestamp',
          'like_count',
          'comments_count'
        ]
      });

      const posts = mediaResponse.data;

      // Get insights for business accounts if requested
      if (includeInsights) {
        for (const post of posts) {
          const insights = await this.getMediaInsights(post.id, accessToken);
          if (insights) {
            post.insights = insights;
          }
        }
      }

      // Analyze content
      const analysis = await this.performContentAnalysis(posts);

      logger.info(`Analyzed ${posts.length} Instagram posts`);
      return { posts, analysis };
    } catch (error) {
      logger.error('Failed to analyze user content:', error);
      throw new Error('Failed to analyze user content');
    }
  }

  /**
   * Perform content analysis for Instagram Learning
   */
  private async performContentAnalysis(posts: InstagramPost[]): Promise<any> {
    const totalPosts = posts.length;
    
    // Calculate average caption length
    const captions = posts.filter(p => p.caption).map(p => p.caption!);
    const avgCaptionLength = captions.length > 0 
      ? captions.reduce((sum, caption) => sum + caption.length, 0) / captions.length 
      : 0;

    // Extract hashtags
    const allHashtags: string[] = [];
    captions.forEach(caption => {
      const hashtags = caption.match(/#\w+/g) || [];
      allHashtags.push(...hashtags.map(h => h.toLowerCase()));
    });

    // Count hashtag frequency
    const hashtagCounts = allHashtags.reduce((acc, hashtag) => {
      acc[hashtag] = (acc[hashtag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonHashtags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([hashtag]) => hashtag);

    // Find top performing posts
    const topPerformingPosts = posts
      .filter(p => p.like_count !== undefined)
      .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
      .slice(0, 10);

    // Analyze posting frequency
    const postsByDate = posts.reduce((acc, post) => {
      const date = new Date(post.timestamp).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Analyze engagement patterns
    const engagementData = posts
      .filter(p => p.like_count !== undefined && p.comments_count !== undefined)
      .map(p => ({
        likes: p.like_count || 0,
        comments: p.comments_count || 0,
        hour: new Date(p.timestamp).getHours(),
        dayOfWeek: new Date(p.timestamp).getDay()
      }));

    const avgEngagement = engagementData.length > 0
      ? engagementData.reduce((sum, data) => sum + data.likes + data.comments, 0) / engagementData.length
      : 0;

    return {
      totalPosts,
      avgCaptionLength: Math.round(avgCaptionLength),
      commonHashtags,
      topPerformingPosts,
      postingFrequency: {
        postsPerDay: Object.values(postsByDate),
        avgPostsPerDay: totalPosts > 0 ? totalPosts / Object.keys(postsByDate).length : 0
      },
      engagementPatterns: {
        avgEngagement: Math.round(avgEngagement),
        bestHours: this.findBestPostingHours(engagementData),
        bestDays: this.findBestPostingDays(engagementData)
      }
    };
  }

  /**
   * Find best posting hours based on engagement
   */
  private findBestPostingHours(engagementData: any[]): number[] {
    const hourlyEngagement = engagementData.reduce((acc, data) => {
      const hour = data.hour;
      if (!acc[hour]) {
        acc[hour] = { total: 0, count: 0 };
      }
      acc[hour].total += data.likes + data.comments;
      acc[hour].count += 1;
      return acc;
    }, {} as Record<number, { total: number; count: number }>);

    return Object.entries(hourlyEngagement)
      .map(([hour, data]) => {
        interface EngagementData {
          total: number;
          count: number;
        }
        return {
          hour: parseInt(hour),
          avgEngagement: (data as EngagementData).total / (data as EngagementData).count
        };
      })
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3)
      .map(item => item.hour);
  }

  /**
   * Find best posting days based on engagement
   */
  private findBestPostingDays(engagementData: any[]): number[] {
    const dailyEngagement = engagementData.reduce((acc, data) => {
      const day = data.dayOfWeek;
      if (!acc[day]) {
        acc[day] = { total: 0, count: 0 };
      }
      acc[day].total += data.likes + data.comments;
      acc[day].count += 1;
      return acc;
    }, {} as Record<number, { total: number; count: number }>);

    return Object.entries(dailyEngagement)
      .map(([day, data]) => {
        interface EngagementData {
          total: number;
          count: number;
        }
        return {
          day: parseInt(day),
          avgEngagement: (data as EngagementData).total / (data as EngagementData).count
        };
      })
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3)
      .map(item => item.day);
  }

  /**
   * Generate personalized caption based on user's style
   */
  async generatePersonalizedCaption(
    userPosts: InstagramPost[],
    contentDescription: string,
    options: {
      tone?: 'professional' | 'casual' | 'funny' | 'inspirational';
      includeHashtags?: boolean;
      maxLength?: number;
    } = {}
  ): Promise<{
    caption: string;
    hashtags: string[];
    styleMatch: number;
    confidence: number;
  }> {
    try {
      // Analyze user's writing style
      const styleAnalysis = await this.analyzeWritingStyle(userPosts);

      // Generate caption based on style
      const caption = await this.generateStyledCaption(
        styleAnalysis,
        contentDescription,
        options
      );

      // Extract hashtags from user's successful posts
      const suggestedHashtags = await this.suggestHashtags(userPosts, contentDescription);

      return {
        caption: caption.text,
        hashtags: suggestedHashtags,
        styleMatch: caption.styleMatch,
        confidence: caption.confidence
      };
    } catch (error) {
      logger.error('Failed to generate personalized caption:', error);
      throw new Error('Failed to generate personalized caption');
    }
  }

  /**
   * Analyze user's writing style
   */
  private async analyzeWritingStyle(posts: InstagramPost[]): Promise<any> {
    const captions = posts.filter(p => p.caption).map(p => p.caption!);
    
    if (captions.length === 0) {
      return {
        dominantTone: 'casual',
        averageLength: 100,
        commonPhrases: [],
        preferredHashtags: []
      };
    }

    // Analyze tone (simplified)
    const toneKeywords = {
      professional: ['excited', 'pleased', 'proud', 'honored', 'delighted'],
      casual: ['hey', 'guys', 'love', 'awesome', 'amazing'],
      funny: ['lol', 'haha', 'funny', 'hilarious', 'joke'],
      inspirational: ['dream', 'believe', 'achieve', 'inspire', 'motivate']
    };

    const toneScores = Object.entries(toneKeywords).map(([tone, keywords]) => {
      const score = captions.reduce((sum, caption) => {
        const matches = keywords.filter(keyword => 
          caption.toLowerCase().includes(keyword)
        ).length;
        return sum + matches;
      }, 0);
      return { tone, score };
    });

    const dominantTone = toneScores.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    ).tone;

    // Calculate average length
    const averageLength = captions.reduce((sum, caption) => sum + caption.length, 0) / captions.length;

    // Extract common phrases (simplified)
    const words = captions.join(' ').toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonPhrases = Object.entries(wordCounts)
      .filter(([word, count]) => count > 2 && word.length > 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    return {
      dominantTone,
      averageLength: Math.round(averageLength),
      commonPhrases,
      preferredHashtags: []
    };
  }

  /**
   * Generate styled caption
   */
  private async generateStyledCaption(
    styleAnalysis: any,
    contentDescription: string,
    options: any
  ): Promise<{ text: string; styleMatch: number; confidence: number }> {
    // This is a simplified implementation
    // In a real scenario, you'd use GPT-4 or similar AI service
    
    const templates = {
      professional: [
        "Excited to share this {content}! {emotion}",
        "Proud to present {content}. {call_to_action}",
        "Delighted to showcase {content}. {question}"
      ],
      casual: [
        "Hey everyone! Check out this {content} 😍 {emotion}",
        "Love this {content}! {question}",
        "Amazing {content} right here! {call_to_action}"
      ],
      funny: [
        "When you find the perfect {content} 😂 {joke}",
        "This {content} had me like... {emotion}",
        "Plot twist: this {content} is actually {funny_fact}"
      ],
      inspirational: [
        "Every {content} tells a story. {inspiration}",
        "Dream big, {content} bigger! {motivation}",
        "This {content} reminds me that {life_lesson}"
      ]
    };

    const tone = options.tone || styleAnalysis.dominantTone;
    const template = templates[tone as keyof typeof templates]?.[0] || templates.casual[0];
    
    const caption = template || ''
      .replace('{content}', contentDescription)
      .replace('{emotion}', '✨')
      .replace('{call_to_action}', 'What do you think?')
      .replace('{question}', 'Would you live here?')
      .replace('{joke}', 'Just kidding! 😄')
      .replace('{funny_fact}', 'pretty awesome')
      .replace('{inspiration}', 'Never give up on your dreams.')
      .replace('{motivation}', 'You got this!')
      .replace('{life_lesson}', 'anything is possible.');

    return {
      text: caption,
      styleMatch: 85, // Simplified scoring
      confidence: 92
    };
  }

  /**
   * Suggest hashtags based on user's successful posts
   */
  private async suggestHashtags(posts: InstagramPost[], contentDescription: string): Promise<string[]> {
    // Extract hashtags from top performing posts
    const topPosts = posts
      .filter(p => p.like_count !== undefined && p.caption)
      .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
      .slice(0, 10);

    const hashtags = new Set<string>();
    
    topPosts.forEach(post => {
      const postHashtags = post.caption!.match(/#\w+/g) || [];
      postHashtags.forEach(hashtag => hashtags.add(String(hashtag).toLowerCase()));
    });

    // Add content-specific hashtags
    const contentHashtags = this.generateContentHashtags(contentDescription);
    contentHashtags.forEach(hashtag => hashtags.add(hashtag));

    return Array.from(hashtags).slice(0, 15);
  }

  /**
   * Generate content-specific hashtags
   */
  private generateContentHashtags(contentDescription: string): string[] {
    const keywords = contentDescription.toLowerCase().split(/\s+/);
    const hashtagMap: Record<string, string[]> = {
      'house': ['#realestate', '#home', '#property', '#househunting'],
      'apartment': ['#apartment', '#condo', '#rental', '#living'],
      'kitchen': ['#kitchen', '#cooking', '#homedecor', '#interior'],
      'bedroom': ['#bedroom', '#sleep', '#cozy', '#comfort'],
      'bathroom': ['#bathroom', '#spa', '#luxury', '#design'],
      'garden': ['#garden', '#outdoor', '#landscape', '#nature'],
      'pool': ['#pool', '#swimming', '#summer', '#relaxation']
    };

    const hashtags: string[] = [];
    keywords.forEach(keyword => {
      if (hashtagMap[keyword]) {
        hashtags.push(...hashtagMap[keyword]);
      }
    });

    return hashtags;
  }
} 