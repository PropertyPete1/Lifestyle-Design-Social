// ========================================
// Instagram Learning Service - AI Content Analysis
// ========================================

import { InstagramBasicDisplayApi, InstagramGraphApi } from '../integrations/instagram/instagramAPI';
import { OpenAIService } from './openaiService';
import { DatabaseService } from './databaseService';
import { logger } from '../utils/logger';

export interface InstagramPost {
  id: string;
  userId: string;
  instagramPostId: string;
  caption: string;
  hashtags: string[];
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  permalink: string;
  timestamp: Date;
  engagementMetrics: EngagementMetrics;
  contentAnalysis: ContentAnalysis;
  performanceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares?: number;
  saves?: number;
  reach?: number;
  impressions?: number;
  engagementRate: number;
  commentsToLikesRatio: number;
}

export interface ContentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  tone: 'casual' | 'professional' | 'funny' | 'inspirational' | 'educational';
  contentType: 'property_tour' | 'market_update' | 'tips_advice' | 'behind_scenes' | 'testimonial';
  keyThemes: string[];
  callToActionPresent: boolean;
  questionPresent: boolean;
  emojiCount: number;
  wordCount: number;
  readabilityScore: number;
}

export interface UserStyle {
  userId: string;
  dominantTone: string;
  averageWordCount: number;
  commonPhrases: string[];
  preferredHashtags: string[];
  topPerformingThemes: string[];
  writingPatterns: WritingPattern[];
  engagementTriggers: string[];
  lastAnalyzed: Date;
}

export interface WritingPattern {
  pattern: string;
  frequency: number;
  avgPerformance: number;
  examples: string[];
}

export interface CaptionSuggestion {
  text: string;
  confidence: number;
  styleMatch: number;
  expectedPerformance: number;
  reasoning: string;
  basedOnPosts: string[];
}

export class InstagramLearningService {
  private instagramApi: InstagramGraphApi;
  private openaiService: OpenAIService;
  private databaseService: DatabaseService;

  constructor() {
    this.instagramApi = new InstagramGraphApi();
    this.openaiService = new OpenAIService();
    this.databaseService = new DatabaseService();
  }

  // ========================================
  // Instagram Data Collection
  // ========================================

  async syncUserInstagramPosts(userId: string, postsToFetch: number = 50): Promise<void> {
    try {
      logger.info(`Starting Instagram sync for user ${userId}, fetching ${postsToFetch} posts`);

      // Get user's Instagram access token
      const platformConnection = await this.databaseService.getPlatformConnection(userId, 'instagram');
      if (!platformConnection || !platformConnection.accessToken) {
        throw new Error('Instagram not connected for this user');
      }

      // Fetch posts from Instagram API
      const instagramPosts = await this.instagramApi.getUserPosts(
        platformConnection.platformUserId,
        platformConnection.accessToken,
        postsToFetch
      );

      logger.info(`Fetched ${instagramPosts.length} posts from Instagram`);

      // Process each post
      for (const post of instagramPosts) {
        await this.processInstagramPost(userId, post);
      }

      // Update user's style analysis
      await this.analyzeUserStyle(userId);

      logger.info(`Instagram sync completed for user ${userId}`);

    } catch (error) {
      logger.error('Instagram sync error:', error);
      throw new Error('Failed to sync Instagram posts');
    }
  }

  private async processInstagramPost(userId: string, rawPost: any): Promise<void> {
    try {
      // Check if post already exists
      const existingPost = await this.databaseService.getInstagramPostByPostId(rawPost.id);
      if (existingPost) {
        logger.debug(`Post ${rawPost.id} already exists, updating metrics`);
        await this.updatePostMetrics(existingPost.id, rawPost);
        return;
      }

      // Extract caption and hashtags
      const caption = rawPost.caption || '';
      const hashtags = this.extractHashtags(caption);
      const cleanCaption = this.removeHashtags(caption);

      // Get engagement metrics
      const engagementMetrics = await this.calculateEngagementMetrics(rawPost);

      // Analyze content with AI
      const contentAnalysis = await this.analyzePostContent(cleanCaption, rawPost);

      // Calculate performance score
      const performanceScore = this.calculatePerformanceScore(engagementMetrics, contentAnalysis);

      // Store in database
      const postData: Partial<InstagramPost> = {
        userId,
        instagramPostId: rawPost.id,
        caption: cleanCaption,
        hashtags,
        mediaType: rawPost.media_type,
        permalink: rawPost.permalink,
        timestamp: new Date(rawPost.timestamp),
        engagementMetrics,
        contentAnalysis,
        performanceScore,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.databaseService.createInstagramPost(postData);
      logger.debug(`Processed and stored post ${rawPost.id}`);

    } catch (error) {
      logger.error(`Error processing post ${rawPost.id}:`, error);
    }
  }

  // ========================================
  // Content Analysis with AI
  // ========================================

  private async analyzePostContent(caption: string, rawPost: any): Promise<ContentAnalysis> {
    try {
      const analysisPrompt = `
        Analyze this Instagram caption for a real estate professional:
        
        Caption: "${caption}"
        Media Type: ${rawPost.media_type}
        
        Provide analysis in JSON format:
        {
          "sentiment": "positive|neutral|negative",
          "tone": "casual|professional|funny|inspirational|educational",
          "contentType": "property_tour|market_update|tips_advice|behind_scenes|testimonial",
          "keyThemes": ["theme1", "theme2"],
          "callToActionPresent": true|false,
          "questionPresent": true|false,
          "emojiCount": number,
          "wordCount": number,
          "readabilityScore": 1-10
        }
      `;

      const response = await this.openaiService.generateCompletion({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in social media content analysis, specializing in real estate marketing.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      logger.error('Content analysis error:', error);
      // Return default analysis if AI fails
      return {
        sentiment: 'neutral',
        tone: 'professional',
        contentType: 'property_tour',
        keyThemes: [],
        callToActionPresent: false,
        questionPresent: false,
        emojiCount: 0,
        wordCount: caption.split(' ').length,
        readabilityScore: 5
      };
    }
  }

  // ========================================
  // User Style Learning
  // ========================================

  async analyzeUserStyle(userId: string): Promise<UserStyle> {
    try {
      logger.info(`Analyzing style for user ${userId}`);

      // Get all user's Instagram posts
      const posts = await this.databaseService.getUserInstagramPosts(userId);
      
      if (posts.length < 5) {
        throw new Error('Need at least 5 posts to analyze style');
      }

      // Get top performing posts (top 20%)
      const topPosts = posts
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, Math.max(1, Math.floor(posts.length * 0.2)));

      // Analyze writing patterns with AI
      const styleAnalysis = await this.generateStyleAnalysis(topPosts);

      // Calculate user style metrics
      const userStyle: UserStyle = {
        userId,
        dominantTone: this.findDominantTone(posts),
        averageWordCount: this.calculateAverageWordCount(posts),
        commonPhrases: await this.extractCommonPhrases(topPosts),
        preferredHashtags: this.analyzeHashtagPatterns(posts),
        topPerformingThemes: this.identifyTopThemes(topPosts),
        writingPatterns: await this.identifyWritingPatterns(topPosts),
        engagementTriggers: await this.findEngagementTriggers(topPosts),
        lastAnalyzed: new Date()
      };

      // Store style analysis
      await this.databaseService.saveUserStyle(userStyle);

      logger.info(`Style analysis completed for user ${userId}`);
      return userStyle;

    } catch (error) {
      logger.error('Style analysis error:', error);
      throw new Error('Failed to analyze user style');
    }
  }

  private async generateStyleAnalysis(posts: InstagramPost[]): Promise<any> {
    const captions = posts.map(p => p.caption).join('\n\n---\n\n');

    const stylePrompt = `
      Analyze the writing style from these high-performing Instagram captions:
      
      ${captions}
      
      Identify:
      1. Common phrases and expressions used repeatedly
      2. Sentence structure patterns
      3. Tone and voice characteristics
      4. Call-to-action patterns
      5. Question usage patterns
      6. Emoji usage patterns
      7. Engagement triggers that work well
      
      Return analysis in JSON format with specific examples.
    `;

    const response = await this.openaiService.generateCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert copywriter analyzing writing style patterns.'
        },
        {
          role: 'user',
          content: stylePrompt
        }
      ],
      temperature: 0.1
    });

    return JSON.parse(response.choices[0].message.content);
  }

  // ========================================
  // Personalized Caption Generation
  // ========================================

  async generatePersonalizedCaption(
    userId: string,
    contentDescription: string,
    targetTone?: string
  ): Promise<CaptionSuggestion[]> {
    try {
      logger.info(`Generating personalized caption for user ${userId}`);

      // Get user's style
      const userStyle = await this.databaseService.getUserStyle(userId);
      if (!userStyle) {
        throw new Error('User style not analyzed yet. Please sync Instagram first.');
      }

      // Get top performing captions as examples
      const topPosts = await this.databaseService.getTopPerformingPosts(userId, 10);

      // Generate captions using AI with user's style
      const captions = await this.generateStyleBasedCaptions(
        contentDescription,
        userStyle,
        topPosts,
        targetTone
      );

      logger.info(`Generated ${captions.length} personalized captions`);
      return captions;

    } catch (error) {
      logger.error('Personalized caption generation error:', error);
      throw new Error('Failed to generate personalized captions');
    }
  }

  private async generateStyleBasedCaptions(
    contentDescription: string,
    userStyle: UserStyle,
    topPosts: InstagramPost[],
    targetTone?: string
  ): Promise<CaptionSuggestion[]> {
    
    const exampleCaptions = topPosts.map(p => `"${p.caption}" (Score: ${p.performanceScore})`).join('\n');

    const generationPrompt = `
      Generate 5 Instagram captions for: "${contentDescription}"
      
      User's Writing Style Analysis:
      - Dominant Tone: ${userStyle.dominantTone}
      - Average Word Count: ${userStyle.averageWordCount}
      - Common Phrases: ${userStyle.commonPhrases.join(', ')}
      - Top Themes: ${userStyle.topPerformingThemes.join(', ')}
      - Engagement Triggers: ${userStyle.engagementTriggers.join(', ')}
      
      High-Performing Examples:
      ${exampleCaptions}
      
      Requirements:
      1. Match the user's writing style and tone exactly
      2. Use similar phrases and expressions from examples
      3. Target tone: ${targetTone || userStyle.dominantTone}
      4. Include proven engagement triggers
      5. Word count around ${userStyle.averageWordCount} words
      6. Don't copy exactly - rewrite with synonyms and variations
      
      Return JSON array:
      [
        {
          "text": "caption text",
          "styleMatch": 85,
          "expectedPerformance": 7.5,
          "reasoning": "why this will work",
          "basedOnPosts": ["post_id_1", "post_id_2"]
        }
      ]
    `;

    const response = await this.openaiService.generateCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert copywriter who specializes in mimicking personal writing styles for social media.'
        },
        {
          role: 'user',
          content: generationPrompt
        }
      ],
      temperature: 0.7
    });

    const suggestions = JSON.parse(response.choices[0].message.content);
    
    return suggestions.map((s: any) => ({
      ...s,
      confidence: s.styleMatch / 100
    }));
  }

  // ========================================
  // Smart Hashtag Recommendations
  // ========================================

  async generatePersonalizedHashtags(
    userId: string,
    contentDescription: string,
    targetReach: 'high' | 'medium' | 'niche' = 'medium'
  ): Promise<string[]> {
    try {
      // Get user's hashtag performance data
      const hashtagAnalysis = await this.analyzeUserHashtagPerformance(userId);
      
      // Get trending hashtags in real estate
      const trendingHashtags = await this.getTrendingRealEstateHashtags();
      
      // Generate personalized hashtag mix
      const hashtags = await this.createOptimalHashtagMix(
        hashtagAnalysis,
        trendingHashtags,
        contentDescription,
        targetReach
      );

      return hashtags;

    } catch (error) {
      logger.error('Personalized hashtag generation error:', error);
      throw new Error('Failed to generate personalized hashtags');
    }
  }

  private async analyzeUserHashtagPerformance(userId: string): Promise<any> {
    const posts = await this.databaseService.getUserInstagramPosts(userId);
    
    const hashtagPerformance = new Map<string, {
      usage: number;
      totalEngagement: number;
      avgEngagement: number;
      lastUsed: Date;
    }>();

    // Analyze each hashtag's performance
    posts.forEach(post => {
      const engagement = post.engagementMetrics.engagementRate;
      
      post.hashtags.forEach(hashtag => {
        const current = hashtagPerformance.get(hashtag) || {
          usage: 0,
          totalEngagement: 0,
          avgEngagement: 0,
          lastUsed: new Date(0)
        };

        current.usage++;
        current.totalEngagement += engagement;
        current.avgEngagement = current.totalEngagement / current.usage;
        current.lastUsed = post.timestamp > current.lastUsed ? post.timestamp : current.lastUsed;

        hashtagPerformance.set(hashtag, current);
      });
    });

    // Convert to sorted array
    return Array.from(hashtagPerformance.entries())
      .map(([hashtag, stats]) => ({ hashtag, ...stats }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);
  }

  // ========================================
  // Performance Prediction
  // ========================================

  async predictCaptionPerformance(
    userId: string,
    caption: string
  ): Promise<{ score: number; confidence: number; factors: string[] }> {
    try {
      const userStyle = await this.databaseService.getUserStyle(userId);
      const historicalPosts = await this.databaseService.getUserInstagramPosts(userId);

      // Analyze caption against user's successful patterns
      const analysis = await this.analyzePostContent(caption, { media_type: 'IMAGE' });
      
      // Calculate similarity to top-performing posts
      const topPosts = historicalPosts
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 5);

      const similarityScores = await this.calculateStyleSimilarity(caption, topPosts);
      
      // Predict performance using AI
      const predictionPrompt = `
        Based on this user's Instagram performance data, predict how well this caption will perform:
        
        Caption: "${caption}"
        
        User's Top Performing Captions:
        ${topPosts.map(p => `"${p.caption}" (Score: ${p.performanceScore})`).join('\n')}
        
        User's Style Metrics:
        - Average Performance: ${historicalPosts.reduce((sum, p) => sum + p.performanceScore, 0) / historicalPosts.length}
        - Dominant Tone: ${userStyle?.dominantTone}
        - Best Themes: ${userStyle?.topPerformingThemes.join(', ')}
        
        Provide prediction score (1-10) and confidence level (0-1).
        
        Return JSON:
        {
          "score": 7.5,
          "confidence": 0.85,
          "factors": ["positive sentiment", "includes CTA", "matches user tone"]
        }
      `;

      const response = await this.openaiService.generateCompletion({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at predicting social media performance based on historical data.'
          },
          {
            role: 'user',
            content: predictionPrompt
          }
        ],
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      logger.error('Performance prediction error:', error);
      return { score: 5, confidence: 0.5, factors: ['analysis unavailable'] };
    }
  }

  // ========================================
  // Manual Approval System
  // ========================================

  async submitForApproval(
    userId: string,
    caption: string,
    hashtags: string[],
    scheduledTime: Date,
    videoId?: string
  ): Promise<string> {
    try {
      // Get performance prediction
      const prediction = await this.predictCaptionPerformance(userId, caption);

      // Create approval request
      const approvalRequest = {
        userId,
        caption,
        hashtags,
        scheduledTime,
        videoId,
        prediction,
        status: 'pending',
        createdAt: new Date()
      };

      const approvalId = await this.databaseService.createApprovalRequest(approvalRequest);

      // Send notification to user
      await this.sendApprovalNotification(userId, approvalId, prediction);

      logger.info(`Created approval request ${approvalId} for user ${userId}`);
      return approvalId;

    } catch (error) {
      logger.error('Submit for approval error:', error);
      throw new Error('Failed to submit for approval');
    }
  }

  async approvePost(approvalId: string, approved: boolean): Promise<void> {
    try {
      await this.databaseService.updateApprovalStatus(approvalId, approved ? 'approved' : 'rejected');

      if (approved) {
        const request = await this.databaseService.getApprovalRequest(approvalId);
        await this.scheduleApprovedPost(request);
      }

      logger.info(`Approval request ${approvalId} ${approved ? 'approved' : 'rejected'}`);

    } catch (error) {
      logger.error('Post approval error:', error);
      throw new Error('Failed to process approval');
    }
  }

  // ========================================
  // Utility Methods
  // ========================================

  private extractHashtags(caption: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    const matches = caption.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
  }

  private removeHashtags(caption: string): string {
    return caption.replace(/#[\w]+/g, '').trim();
  }

  private calculateEngagementMetrics(rawPost: any): EngagementMetrics {
    const likes = rawPost.like_count || 0;
    const comments = rawPost.comments_count || 0;
    const engagementRate = ((likes + comments) / (rawPost.reach || likes + comments)) * 100;

    return {
      likes,
      comments,
      shares: rawPost.shares_count || 0,
      saves: rawPost.saves_count || 0,
      reach: rawPost.reach || 0,
      impressions: rawPost.impressions || 0,
      engagementRate,
      commentsToLikesRatio: likes > 0 ? comments / likes : 0
    };
  }

  private calculatePerformanceScore(metrics: EngagementMetrics, analysis: ContentAnalysis): number {
    // Weighted scoring algorithm
    const engagementWeight = 0.4;
    const contentQualityWeight = 0.3;
    const reachWeight = 0.3;

    const engagementScore = Math.min(10, metrics.engagementRate / 5); // Normalize to 0-10
    const contentScore = analysis.readabilityScore;
    const reachScore = Math.min(10, (metrics.reach || 0) / 1000); // Normalize reach

    return (
      engagementScore * engagementWeight +
      contentScore * contentQualityWeight +
      reachScore * reachWeight
    );
  }

  private findDominantTone(posts: InstagramPost[]): string {
    const tones = posts.map(p => p.contentAnalysis.tone);
    const toneCount = tones.reduce((acc, tone) => {
      acc[tone] = (acc[tone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(toneCount)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  private calculateAverageWordCount(posts: InstagramPost[]): number {
    const totalWords = posts.reduce((sum, p) => sum + p.contentAnalysis.wordCount, 0);
    return Math.round(totalWords / posts.length);
  }

  private async extractCommonPhrases(posts: InstagramPost[]): Promise<string[]> {
    const allCaptions = posts.map(p => p.caption).join(' ');
    
    // Use AI to identify common phrases
    const response = await this.openaiService.generateCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: `Extract the 10 most commonly used phrases (2-4 words) from this text: ${allCaptions}`
        }
      ],
      temperature: 0.1
    });

    return response.choices[0].message.content.split('\n').slice(0, 10);
  }

  private analyzeHashtagPatterns(posts: InstagramPost[]): string[] {
    const hashtagCount = new Map<string, number>();
    
    posts.forEach(post => {
      post.hashtags.forEach(hashtag => {
        hashtagCount.set(hashtag, (hashtagCount.get(hashtag) || 0) + 1);
      });
    });

    return Array.from(hashtagCount.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([hashtag]) => hashtag);
  }

  private identifyTopThemes(posts: InstagramPost[]): string[] {
    const themes = posts.flatMap(p => p.contentAnalysis.keyThemes);
    const themeCount = themes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(themeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([theme]) => theme);
  }

  private async identifyWritingPatterns(posts: InstagramPost[]): Promise<WritingPattern[]> {
    // This would involve more complex NLP analysis
    // For now, return basic patterns
    return [
      {
        pattern: 'Question + Answer format',
        frequency: posts.filter(p => p.contentAnalysis.questionPresent).length,
        avgPerformance: 7.5,
        examples: posts.filter(p => p.contentAnalysis.questionPresent).slice(0, 3).map(p => p.caption)
      }
    ];
  }

  private async findEngagementTriggers(posts: InstagramPost[]): Promise<string[]> {
    const topPosts = posts.sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5);
    
    // Analyze what makes these posts successful
    const triggers = new Set<string>();
    
    topPosts.forEach(post => {
      if (post.contentAnalysis.callToActionPresent) triggers.add('Call-to-Action');
      if (post.contentAnalysis.questionPresent) triggers.add('Questions');
      if (post.contentAnalysis.emojiCount > 3) triggers.add('Emojis');
      if (post.contentAnalysis.tone === 'funny') triggers.add('Humor');
    });

    return Array.from(triggers);
  }

  private async calculateStyleSimilarity(caption: string, topPosts: InstagramPost[]): Promise<number[]> {
    // Use AI to calculate style similarity
    // This is a simplified version
    return topPosts.map(() => Math.random() * 0.4 + 0.6); // 0.6-1.0 range
  }

  private async getTrendingRealEstateHashtags(): Promise<string[]> {
    // This would integrate with hashtag tracking APIs
    return [
      '#realestate', '#homes', '#property', '#realtor', '#forsale',
      '#dreamhome', '#investment', '#luxury', '#newlisting', '#sold'
    ];
  }

  private async createOptimalHashtagMix(
    userHashtags: any[],
    trending: string[],
    content: string,
    reach: string
  ): Promise<string[]> {
    // Intelligent hashtag mixing algorithm
    const mix: string[] = [];
    
    // Add user's best performing hashtags (40%)
    mix.push(...userHashtags.slice(0, 8).map(h => h.hashtag));
    
    // Add trending hashtags (30%)
    mix.push(...trending.slice(0, 6));
    
    // Add content-specific hashtags (30%)
    const contentTags = await this.generateContentSpecificHashtags(content);
    mix.push(...contentTags.slice(0, 6));

    return [...new Set(mix)].slice(0, 20); // Remove duplicates, limit to 20
  }

  private async generateContentSpecificHashtags(content: string): Promise<string[]> {
    const response = await this.openaiService.generateCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: `Generate 10 specific hashtags for this real estate content: ${content}`
        }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content
      .split('\n')
      .map(tag => tag.trim().replace('#', ''))
      .filter(tag => tag.length > 0)
      .map(tag => `#${tag.toLowerCase()}`);
  }

  private async updatePostMetrics(postId: string, rawPost: any): Promise<void> {
    const newMetrics = this.calculateEngagementMetrics(rawPost);
    await this.databaseService.updateInstagramPostMetrics(postId, newMetrics);
  }

  private async sendApprovalNotification(userId: string, approvalId: string, prediction: any): Promise<void> {
    // Send email/push notification about pending approval
    logger.info(`Sending approval notification for ${approvalId} to user ${userId}`);
  }

  private async scheduleApprovedPost(request: any): Promise<void> {
    // Schedule the approved post for publishing
    logger.info(`Scheduling approved post ${request.id}`);
  }
}

export default InstagramLearningService; 