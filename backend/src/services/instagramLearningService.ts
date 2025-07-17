import { logger } from '../utils/logger';
import { connectToDatabase } from '../config/database';
import { InstagramLearning } from '../models/InstagramLearning';
import { UserInsights } from '../models/UserInsights';
import { User } from '../models/User';
import { Post } from '../models/Post';

export interface InstagramPost {
  id: string;
  caption: string;
  hashtags: string[];
  mediaType: 'VIDEO' | 'IMAGE' | 'CAROUSEL_ALBUM';
  mediaUrl: string;
  permalink: string;
  timestamp: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
    impressions: number;
  };
  engagementRate: number;
  isHighPerforming: boolean;
}

export interface CaptionVariation {
  originalCaption: string;
  variations: string[];
  similarity: number;
  engagementScore: number;
}

export interface LearningInsight {
  bestPerformingHours: number[];
  topHashtags: string[];
  bestCaptionPatterns: string[];
  optimalCaptionLength: { min: number; max: number };
  highEngagementWords: string[];
  callToActionPatterns: string[];
}

class InstagramLearningService {
  private readonly SIMILARITY_THRESHOLD = 0.7;
  private readonly HIGH_PERFORMANCE_THRESHOLD = 0.05; // 5% engagement rate
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  // Sync Instagram posts and analyze performance
  async syncInstagramPosts(userId: string): Promise<void> {
    try {
      logger.info(`Starting Instagram post sync for user ${userId}`);

      // Get user's Instagram credentials
      const credentials = await this.getUserInstagramCredentials(userId);
      
      if (!credentials?.instagramAccessToken) {
        logger.warn(`No Instagram credentials found for user ${userId}`);
        return;
      }

      // Fetch recent Instagram posts
      const instagramPosts = await this.fetchInstagramPosts(credentials.instagramAccessToken);
      
      // Store posts and analyze performance
      for (const post of instagramPosts) {
        await this.storeInstagramPost(userId, post);
      }

      // Analyze overall performance and generate insights
      await this.analyzePostPerformance(userId);

      logger.info(`Completed Instagram sync for user ${userId}: ${instagramPosts.length} posts processed`);

    } catch (error) {
      logger.error(`Error syncing Instagram posts for user ${userId}:`, error);
      throw error;
    }
  }

  // Fetch Instagram posts from API
  private async fetchInstagramPosts(accessToken: string): Promise<InstagramPost[]> {
    try {
      // Instagram Basic Display API implementation would go here
      // For now, return mock data to maintain service functionality
      logger.info('Fetching Instagram posts (mock data)');
      
      return [
        {
          id: 'sample_post_1',
          caption: 'Beautiful property with amazing views! #realestate #luxury #home',
          hashtags: ['#realestate', '#luxury', '#home'],
          mediaType: 'VIDEO',
          mediaUrl: 'https://instagram.com/sample.mp4',
          permalink: 'https://instagram.com/p/sample',
          timestamp: new Date(),
          engagement: {
            likes: 150,
            comments: 25,
            shares: 10,
            saves: 8,
            reach: 1200,
            impressions: 1500
          },
          engagementRate: 0.128,
          isHighPerforming: true
        }
      ];

    } catch (error) {
      logger.error('Error fetching Instagram posts:', error);
      return [];
    }
  }

  // Store Instagram post for learning
  private async storeInstagramPost(userId: string, post: InstagramPost): Promise<void> {
    try {
      await connectToDatabase();

      await InstagramLearning.findOneAndUpdate(
        { userId, postId: post.id },
        {
          userId,
          postId: post.id,
          caption: post.caption,
          hashtags: post.hashtags,
          mediaType: post.mediaType,
          mediaUrl: post.mediaUrl,
          permalink: post.permalink,
          timestamp: post.timestamp,
          engagementData: post.engagement,
          engagementRate: post.engagementRate,
          isHighPerforming: post.isHighPerforming
        },
        { upsert: true, new: true }
      );

    } catch (error) {
      logger.error('Error storing Instagram post:', error);
      throw error;
    }
  }

  // Generate caption variations based on high-performing posts
  async generateCaptionVariations(userId: string, videoKeywords: string[], videoType: 'real_estate' | 'cartoon'): Promise<CaptionVariation[]> {
    try {
      // Get high-performing posts similar to the video
      const similarPosts = await this.findSimilarHighPerformingPosts(userId, videoKeywords, videoType);
      
      if (similarPosts.length === 0) {
        logger.info(`No similar high-performing posts found for user ${userId}`);
        return [];
      }

      const variations: CaptionVariation[] = [];

      // Generate variations for each high-performing caption
      for (const post of similarPosts.slice(0, 3)) { // Top 3 similar posts
        const captionVariations = await this.createCaptionVariations(post.caption, videoKeywords, videoType);
        
        variations.push({
          originalCaption: post.caption,
          variations: captionVariations,
          similarity: this.calculateSimilarity(videoKeywords.join(' '), post.caption),
          engagementScore: post.engagementRate
        });
      }

      return variations;

    } catch (error) {
      logger.error('Error generating caption variations:', error);
      return [];
    }
  }

  // Find similar high-performing posts
  private async findSimilarHighPerformingPosts(userId: string, keywords: string[], _videoType: string): Promise<any[]> {
    try {
      await connectToDatabase();

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const posts = await InstagramLearning.find({
        userId: userId,
        isHighPerforming: true,
        mediaType: 'VIDEO',
        createdAt: { $gte: ninetyDaysAgo }
      })
      .sort({ engagementRate: -1 })
      .limit(20);

      // Score posts based on keyword similarity
      const scoredPosts = posts.map(post => ({
        ...post.toObject(),
        similarity: this.calculateSimilarity(keywords.join(' '), post.caption),
        engagementRate: post.engagementRate
      }));

      // Filter by similarity threshold and sort by engagement rate
      return scoredPosts
        .filter(post => post.similarity > 0.3)
        .sort((a, b) => b.engagementRate - a.engagementRate);

    } catch (error) {
      logger.error('Error finding similar high-performing posts:', error);
      return [];
    }
  }

  // Create caption variations using AI
  private async createCaptionVariations(originalCaption: string, keywords: string[], videoType: string): Promise<string[]> {
    try {
      if (!this.OPENAI_API_KEY) {
        logger.warn('OpenAI API key not configured, using template variations');
        return this.createTemplateVariations(originalCaption, keywords, videoType);
      }

      // OpenAI API implementation would go here
      // For now, return template-based variations
      return this.createTemplateVariations(originalCaption, keywords, videoType);

    } catch (error) {
      logger.error('Error creating caption variations:', error);
      return this.createTemplateVariations(originalCaption, keywords, videoType);
    }
  }

  // Create template-based caption variations
  private createTemplateVariations(originalCaption: string, keywords: string[], videoType: string): string[] {
    const variations: string[] = [];
    
    // Extract hashtags from original
    const hashtagMatch = originalCaption.match(/#\w+/g) || [];
    const baseCaption = originalCaption.replace(/#\w+/g, '').trim();
    
    if (videoType === 'real_estate') {
      variations.push(
        `${baseCaption} Perfect for ${keywords.join(' and ')}! ${hashtagMatch.join(' ')}`,
        `Looking for ${keywords.join(' or ')}? ${baseCaption} ${hashtagMatch.join(' ')}`,
        `${baseCaption} What do you think about this ${keywords[0]}? ${hashtagMatch.join(' ')}`
      );
    } else {
      variations.push(
        `${baseCaption} Who else loves this? ${hashtagMatch.join(' ')}`,
        `${baseCaption} Tag someone who needs to see this! ${hashtagMatch.join(' ')}`,
        `${baseCaption} Your thoughts? ${hashtagMatch.join(' ')}`
      );
    }
    
    return variations.filter(v => v.length > 10);
  }

  // Calculate text similarity using Jaccard similarity
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  // Check if caption is too similar to recent posts
  async checkCaptionSimilarity(userId: string, newCaption: string): Promise<boolean> {
    try {
      await connectToDatabase();

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentPosts = await Post.find({
        userId: userId,
        createdAt: { $gte: sixtyDaysAgo },
        status: { $in: ['posted', 'scheduled'] }
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('caption');

      const recentCaptions = recentPosts.map(post => post.content || '');

      // Check similarity against recent captions
      for (const recentCaption of recentCaptions) {
        const similarity = this.calculateSimilarity(newCaption, recentCaption);
        if (similarity > this.SIMILARITY_THRESHOLD) {
          logger.warn(`Caption similarity too high: ${similarity.toFixed(2)}`);
          return false; // Too similar
        }
      }

      return true; // Caption is unique enough

    } catch (error) {
      logger.error('Error checking caption similarity:', error);
      return true; // Default to allowing the caption
    }
  }

  // Analyze post performance and extract insights
  private async analyzePostPerformance(userId: string): Promise<void> {
    try {
      const insights = await this.generateLearningInsights(userId);
      
      // Store insights in database
      await connectToDatabase();

      await UserInsights.findOneAndUpdate(
        { userId },
        { userId, insightsData: insights },
        { upsert: true, new: true }
      );

      logger.info(`Generated learning insights for user ${userId}`);

    } catch (error) {
      logger.error('Error analyzing post performance:', error);
    }
  }

  // Generate learning insights from historical data
  private async generateLearningInsights(userId: string): Promise<LearningInsight> {
    try {
      await connectToDatabase();

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const posts = await InstagramLearning.find({
        userId: userId,
        createdAt: { $gte: ninetyDaysAgo }
      })
      .sort({ engagementRate: -1 });

      if (posts.length === 0) {
        return this.getDefaultInsights();
      }

      // Analyze best performing hours
      const hourlyPerformance: { [hour: number]: number[] } = {};
      const hashtagCounts: { [hashtag: string]: number } = {};
      const captionLengths: number[] = [];
      const engagementWords: { [word: string]: number } = {};

      for (const post of posts) {
        const hour = post.timestamp.getHours();
        if (!hourlyPerformance[hour]) hourlyPerformance[hour] = [];
        hourlyPerformance[hour].push(post.engagementRate);

        // Count hashtags
        for (const hashtag of post.hashtags) {
          hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
        }

        // Analyze caption length
        captionLengths.push(post.caption.length);

        // Count words in high-performing posts
        if (post.isHighPerforming) {
          const words = post.caption.toLowerCase().split(/\s+/);
          for (const word of words) {
            if (word.length > 3 && !word.startsWith('#')) {
              engagementWords[word] = (engagementWords[word] || 0) + 1;
            }
          }
        }
      }

      // Calculate best hours (highest average engagement)
      const bestHours = Object.entries(hourlyPerformance)
        .map(([hour, rates]) => ({
          hour: parseInt(hour),
          avgRate: rates.reduce((a, b) => a + b, 0) / rates.length
        }))
        .sort((a, b) => b.avgRate - a.avgRate)
        .slice(0, 3)
        .map(h => h.hour);

      // Get top hashtags
      const topHashtags = Object.entries(hashtagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([hashtag]) => hashtag);

      // Calculate optimal caption length
      const avgLength = captionLengths.reduce((a, b) => a + b, 0) / captionLengths.length;
      const optimalLength = {
        min: Math.max(50, Math.floor(avgLength * 0.8)),
        max: Math.min(500, Math.ceil(avgLength * 1.2))
      };

      // Get high engagement words
      const highEngagementWords = Object.entries(engagementWords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);

      return {
        bestPerformingHours: bestHours,
        topHashtags,
        bestCaptionPatterns: ['question', 'call_to_action', 'storytelling'],
        optimalCaptionLength: optimalLength,
        highEngagementWords,
        callToActionPatterns: [
          'What do you think?',
          'Tag someone who',
          'Comment below',
          'Double tap if you agree'
        ]
      };

    } catch (error) {
      logger.error('Error generating learning insights:', error);
      return this.getDefaultInsights();
    }
  }

  private calculateEngagementRate(post: any): number {
    const totalEngagement = (post.like_count || 0) + (post.comments_count || 0) + (post.shares_count || 0);
    const reach = post.reach || post.impressions || 1;
    return totalEngagement / reach;
  }

  private async getUserInstagramCredentials(userId: string): Promise<any> {
    try {
      await connectToDatabase();
      
      const user = await User.findById(userId).select('instagramAccessToken instagramRefreshToken instagramUserId');
      return user;
    } catch (error) {
      logger.error('Error getting user Instagram credentials:', error);
      return null;
    }
  }

  private getDefaultInsights(): LearningInsight {
    return {
      bestPerformingHours: [9, 13, 18],
      topHashtags: ['#realestate', '#home', '#property', '#investment', '#luxury'],
      bestCaptionPatterns: ['question', 'call_to_action'],
      optimalCaptionLength: { min: 100, max: 300 },
      highEngagementWords: ['home', 'dream', 'perfect', 'stunning', 'amazing'],
      callToActionPatterns: ['What do you think?', 'Tag someone who', 'Comment below']
    };
  }

  // Get user's learning insights
  async getUserInsights(userId: string): Promise<LearningInsight> {
    try {
      await connectToDatabase();
      
      const userInsights = await UserInsights.findOne({ userId });
      
      if (userInsights?.insightsData) {
        return userInsights.insightsData;
      }
      
      return this.getDefaultInsights();

    } catch (error) {
      logger.error('Error getting user insights:', error);
      return this.getDefaultInsights();
    }
  }
}

export const instagramLearningService = new InstagramLearningService(); 