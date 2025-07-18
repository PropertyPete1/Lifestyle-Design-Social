// import { connectToDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { connectToDatabase } from '../config/database';
import { HashtagLibrary } from '../models/HashtagLibrary';
import { TrendingHashtag } from '../models/TrendingHashtag';
import { HashtagPerformance } from '../models/HashtagPerformance';

export interface HashtagLibrary {
  id: string;
  userId: string;
  category: 'real_estate' | 'viral' | 'trending' | 'custom';
  hashtags: string[];
  performance: {
    averageEngagement: number;
    totalUses: number;
    lastUsed: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrendingHashtag {
  hashtag: string;
  platform: 'instagram' | 'tiktok' | 'twitter';
  trendingScore: number;
  category: string;
  fetchedAt: Date;
  expiresAt: Date;
}

export interface HashtagRecommendation {
  hashtags: string[];
  categories: {
    realEstate: string[];
    viral: string[];
    trending: string[];
    custom: string[];
  };
  totalCount: number;
  estimatedReach: number;
}

class HashtagService {
  private readonly MAX_HASHTAGS_PER_POST = 30;
  private readonly MIN_HASHTAGS_PER_POST = 25;
  // private readonly _TRENDING_CACHE_HOURS = 6;

  // Master hashtag libraries
  private readonly REAL_ESTATE_HASHTAGS = [
    '#realestate',
    '#realtor',
    '#property',
    '#home',
    '#house',
    '#luxury',
    '#forsale',
    '#dreamhome',
    '#realty',
    '#investment',
    '#homebuying',
    '#homeselling',
    '#realestateagent',
    '#openhouse',
    '#mortgage',
    '#staging',
    '#renovation',
    '#interiordesign',
    '#architecture',
    '#homedecor',
    '#curb appeal',
    '#justlisted',
    '#sold',
    '#pending',
    '#newlisting',
    '#buyersagent',
    '#sellersagent',
    '#firsttimehomebuyer',
  ];

  private readonly VIRAL_HASHTAGS = [
    '#viral',
    '#fyp',
    '#trending',
    '#foryou',
    '#explore',
    '#discovermore',
    '#reels',
    '#instagood',
    '#photooftheday',
    '#amazing',
    '#followme',
    '#like4like',
    '#instadaily',
    '#igers',
    '#instalike',
    '#instamood',
    '#ootd',
    '#love',
    '#cute',
    '#followforfollow',
    '#comment4comment',
    '#likeback',
    '#followback',
    '#instafamous',
    '#popular',
    '#trend',
  ];

  // Generate hashtag recommendations for content
  async generateRecommendations(
    userId: string,
    content: string,
    videoType: 'real_estate' | 'cartoon' = 'real_estate'
  ): Promise<HashtagRecommendation> {
    try {
      logger.info(`Generating hashtag recommendations for user ${userId}, type: ${videoType}`);

      // Initialize user's hashtag libraries if they don't exist
      await this.initializeUserLibraries(userId);

      // Get user's custom hashtag libraries
      const userLibraries = await this.getUserHashtagLibraries(userId);

      // Get trending hashtags
      const trendingHashtags = await this.getTrendingHashtags();

      // Generate content-specific recommendations
      const contentHashtags = this.analyzeContentForHashtags(content);

      // Combine hashtags with intelligent selection
      const recommendations = this.selectOptimalHashtags({
        userLibraries,
        trending: trendingHashtags,
        contentBased: contentHashtags,
        videoType,
      });

      logger.info(`Generated ${recommendations.hashtags.length} hashtag recommendations`);
      return recommendations;
    } catch (error) {
      logger.error('Error generating hashtag recommendations:', error);
      return this.getDefaultRecommendations(videoType);
    }
  }

  // Initialize default hashtag libraries for new users
  private async initializeUserLibraries(userId: string): Promise<void> {
    try {
      await connectToDatabase();

      // Create real estate library
      await this.createHashtagLibrary(userId, 'real_estate', this.REAL_ESTATE_HASHTAGS);

      // Create viral library
      await this.createHashtagLibrary(userId, 'viral', this.VIRAL_HASHTAGS);

      logger.info(`Initialized hashtag libraries for user ${userId}`);
    } catch (error) {
      logger.error('Error initializing user libraries:', error);
    }
  }

  // Create or update hashtag library
  private async createHashtagLibrary(
    userId: string,
    category: 'real_estate' | 'viral' | 'trending' | 'custom',
    hashtags: string[]
  ): Promise<void> {
    try {
      await connectToDatabase();

      await HashtagLibrary.findOneAndUpdate(
        { userId, category },
        {
          userId,
          category,
          hashtags,
          performance: {
            averageEngagement: 0,
            totalUses: 0,
            lastUsed: new Date(),
          },
          isActive: true,
        },
        { upsert: true, new: true }
      );

      logger.info(
        `Created/updated ${category} hashtag library for user ${userId} with ${hashtags.length} hashtags`
      );
    } catch (error) {
      logger.error('Error creating hashtag library:', error);
    }
  }

  // Analyze content for relevant hashtags
  private analyzeContentForHashtags(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const suggestions: string[] = [];

    // Real estate keywords mapping
    const keywordMap: Record<string, string[]> = {
      kitchen: ['#kitchen', '#chefskitchen', '#modernkitchen'],
      bathroom: ['#bathroom', '#masterbath', '#spa'],
      bedroom: ['#bedroom', '#masterbedroom', '#cozy'],
      garden: ['#garden', '#landscaping', '#outdoor'],
      pool: ['#pool', '#luxury', '#entertainment'],
      garage: ['#garage', '#parking', '#storage'],
      view: ['#view', '#scenic', '#location'],
      modern: ['#modern', '#contemporary', '#design'],
      luxury: ['#luxury', '#premium', '#upscale'],
      new: ['#new', '#newconstruction', '#fresh'],
    };

    for (const word of words) {
      if (keywordMap[word]) {
        suggestions.push(...keywordMap[word]);
      }
    }

    return Array.from(new Set(suggestions));
  }

  // Select optimal hashtags using intelligent algorithm
  private selectOptimalHashtags(data: {
    userLibraries: any[];
    trending: TrendingHashtag[];
    contentBased: string[];
    videoType: 'real_estate' | 'cartoon';
  }): HashtagRecommendation {
    const allHashtags: string[] = [];
    const categories = {
      realEstate: [] as string[],
      viral: [] as string[],
      trending: [] as string[],
      custom: [] as string[],
    };

    // Add base hashtags based on video type
    const baseHashtags =
      data.videoType === 'real_estate'
        ? this.REAL_ESTATE_HASHTAGS.slice(0, 15)
        : this.VIRAL_HASHTAGS.slice(0, 15);

    allHashtags.push(...baseHashtags);
    if (data.videoType === 'real_estate') {
      categories.realEstate.push(...baseHashtags);
    } else {
      categories.viral.push(...baseHashtags);
    }

    // Add content-based hashtags
    allHashtags.push(...data.contentBased.slice(0, 8));
    categories.custom.push(...data.contentBased);

    // Add trending hashtags
    const trendingTags = data.trending.slice(0, 7).map((t) => t.hashtag);
    allHashtags.push(...trendingTags);
    categories.trending.push(...trendingTags);

    // Add viral hashtags for engagement
    const viralBoost = this.VIRAL_HASHTAGS.slice(0, 5);
    allHashtags.push(...viralBoost);
    categories.viral.push(...viralBoost);

    // Optimize hashtag count and remove duplicates
    const optimizedHashtags = this.optimizeHashtagCount(allHashtags);

    return {
      hashtags: optimizedHashtags,
      categories,
      totalCount: optimizedHashtags.length,
      estimatedReach: this.estimateReach(optimizedHashtags),
    };
  }

  // Calculate hashtag relevance score
  private calculateRelevanceScore(hashtag: string, content: string, videoType: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();
    const lowerHashtag = hashtag.toLowerCase().replace('#', '');

    // Direct keyword match
    if (lowerContent.includes(lowerHashtag)) {
      score += 3;
    }

    // Video type relevance
    if (videoType === 'real_estate' && this.REAL_ESTATE_HASHTAGS.includes(hashtag)) {
      score += 2;
    }

    // Viral potential
    if (this.VIRAL_HASHTAGS.includes(hashtag)) {
      score += 1;
    }

    // Length preference (shorter hashtags often perform better)
    if (hashtag.length <= 15) {
      score += 1;
    }

    return score;
  }

  // Optimize hashtag count to be within limits
  private optimizeHashtagCount(hashtags: string[]): string[] {
    const uniqueHashtags = Array.from(new Set(hashtags));

    if (uniqueHashtags.length > this.MAX_HASHTAGS_PER_POST) {
      return uniqueHashtags.slice(0, this.MAX_HASHTAGS_PER_POST);
    }

    if (uniqueHashtags.length < this.MIN_HASHTAGS_PER_POST) {
      // Add more hashtags from default libraries
      const additionalNeeded = this.MIN_HASHTAGS_PER_POST - uniqueHashtags.length;
      const additionalHashtags = this.VIRAL_HASHTAGS.filter(
        (h) => !uniqueHashtags.includes(h)
      ).slice(0, additionalNeeded);

      return [...uniqueHashtags, ...additionalHashtags];
    }

    return uniqueHashtags;
  }

  // Estimate reach based on hashtags
  private estimateReach(hashtags: string[]): number {
    // Simple estimation based on hashtag count and type
    const realEstateCount = hashtags.filter((h) => this.REAL_ESTATE_HASHTAGS.includes(h)).length;
    const viralCount = hashtags.filter((h) => this.VIRAL_HASHTAGS.includes(h)).length;

    return realEstateCount * 1000 + viralCount * 2000 + hashtags.length * 500;
  }

  // Update trending hashtags from various sources
  async updateTrendingHashtags(userId: string): Promise<void> {
    try {
      logger.info(`Updating trending hashtags for user ${userId}`);

      // Fetch trending hashtags from multiple sources
      const instagramTrending = await this.fetchInstagramTrending();
      const tiktokTrending = await this.fetchTikTokTrending();
      const googleTrending = await this.fetchGoogleTrending();

      // Combine and store trending hashtags
      const allTrending = [...instagramTrending, ...tiktokTrending, ...googleTrending];

      for (const trending of allTrending) {
        await this.storeTrendingHashtag(trending);
      }

      // Update user's trending hashtag library
      const trendingHashtags = allTrending.map((t) => t.hashtag);
      await this.createHashtagLibrary(userId, 'trending', trendingHashtags);

      logger.info(`Updated ${allTrending.length} trending hashtags`);
    } catch (error) {
      logger.error('Error updating trending hashtags:', error);
    }
  }

  // Fetch Instagram trending hashtags
  private async fetchInstagramTrending(): Promise<TrendingHashtag[]> {
    try {
      // Instagram doesn't provide a public trending API
      // This would need to be implemented with web scraping or third-party services
      // For now, return mock trending hashtags
      return [
        {
          hashtag: '#trending',
          platform: 'instagram',
          trendingScore: 95,
          category: 'general',
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
        {
          hashtag: '#viral',
          platform: 'instagram',
          trendingScore: 90,
          category: 'general',
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
        {
          hashtag: '#explore',
          platform: 'instagram',
          trendingScore: 85,
          category: 'general',
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
      ];
    } catch (error) {
      logger.error('Error fetching Instagram trending:', error);
      return [];
    }
  }

  // Fetch TikTok trending hashtags
  private async fetchTikTokTrending(): Promise<TrendingHashtag[]> {
    try {
      // TikTok trending would require their API or web scraping
      // For now, return mock trending hashtags
      return [
        {
          hashtag: '#fyp',
          platform: 'tiktok',
          trendingScore: 98,
          category: 'general',
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
        {
          hashtag: '#foryou',
          platform: 'tiktok',
          trendingScore: 95,
          category: 'general',
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
        {
          hashtag: '#viral',
          platform: 'tiktok',
          trendingScore: 92,
          category: 'general',
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
      ];
    } catch (error) {
      logger.error('Error fetching TikTok trending:', error);
      return [];
    }
  }

  // Fetch Google trending topics and convert to hashtags
  private async fetchGoogleTrending(): Promise<TrendingHashtag[]> {
    try {
      // Google Trends API would be used here
      // For now, return mock trending hashtags
      return [
        {
          hashtag: '#news',
          platform: 'twitter',
          trendingScore: 80,
          category: 'news',
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
        {
          hashtag: '#breaking',
          platform: 'twitter',
          trendingScore: 75,
          category: 'news',
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
      ];
    } catch (error) {
      logger.error('Error fetching Google trending:', error);
      return [];
    }
  }

  // Store trending hashtag
  private async storeTrendingHashtag(trending: TrendingHashtag): Promise<void> {
    try {
      await connectToDatabase();

      await TrendingHashtag.findOneAndUpdate(
        { hashtag: trending.hashtag, platform: trending.platform },
        trending,
        { upsert: true, new: true }
      );

      logger.info(`Stored trending hashtag: ${trending.hashtag}`);
    } catch (error) {
      logger.error('Error storing trending hashtag:', error);
    }
  }

  // Get user's hashtag libraries
  private async getUserHashtagLibraries(userId: string): Promise<any[]> {
    try {
      await connectToDatabase();

      const libraries = await HashtagLibrary.find({
        userId: userId,
        isActive: true,
      }).sort({ category: 1 });

      return libraries.map((lib) => ({
        id: String(lib._id),
        userId: lib.userId,
        category: lib.category,
        hashtags: lib.hashtags,
        performance: lib.performance,
        isActive: lib.isActive,
        createdAt: lib.createdAt,
        updatedAt: lib.updatedAt,
      }));
    } catch (error) {
      logger.error('Error getting user hashtag libraries:', error);
      return [];
    }
  }

  // Get trending hashtags
  private async getTrendingHashtags(): Promise<TrendingHashtag[]> {
    try {
      await connectToDatabase();

      const trending = await TrendingHashtag.find({
        expiresAt: { $gt: new Date() },
      })
        .sort({ trendingScore: -1 })
        .limit(20);

      return trending.map((t) => ({
        hashtag: t.hashtag,
        platform: t.platform,
        trendingScore: t.trendingScore,
        category: t.category,
        fetchedAt: t.fetchedAt,
        expiresAt: t.expiresAt,
      }));
    } catch (error) {
      logger.error('Error getting trending hashtags:', error);
      return [];
    }
  }

  // Get default recommendations
  private getDefaultRecommendations(videoType: 'real_estate' | 'cartoon'): HashtagRecommendation {
    const defaultHashtags =
      videoType === 'real_estate'
        ? [...this.REAL_ESTATE_HASHTAGS.slice(0, 20), ...this.VIRAL_HASHTAGS.slice(0, 10)]
        : [...this.VIRAL_HASHTAGS.slice(0, 20), ...this.REAL_ESTATE_HASHTAGS.slice(0, 10)];

    return {
      hashtags: defaultHashtags,
      categories: {
        realEstate: this.REAL_ESTATE_HASHTAGS.slice(0, 15),
        viral: this.VIRAL_HASHTAGS.slice(0, 15),
        trending: [],
        custom: [],
      },
      totalCount: defaultHashtags.length,
      estimatedReach: this.estimateReach(defaultHashtags),
    };
  }

  // Update hashtag performance metrics
  async updateHashtagPerformance(
    userId: string,
    hashtag: string,
    engagementData: { likes: number; comments: number; shares: number }
  ): Promise<void> {
    try {
      await connectToDatabase();

      const totalEngagement =
        (engagementData.likes || 0) + (engagementData.comments || 0) + (engagementData.shares || 0);

      // Find existing performance record or create new one
      const existingPerformance = await HashtagPerformance.findOne({
        userId: userId,
        hashtag: hashtag,
      });

      if (existingPerformance) {
        // Update existing record
        const newTotalUses = existingPerformance.totalUses + 1;
        const newTotalEngagement = existingPerformance.totalEngagement + totalEngagement;
        const newAverageEngagement = newTotalEngagement / newTotalUses;

        await HashtagPerformance.findByIdAndUpdate(existingPerformance._id, {
          totalUses: newTotalUses,
          totalEngagement: newTotalEngagement,
          averageEngagement: newAverageEngagement,
          lastUsed: new Date(),
        });
      } else {
        // Create new record
        await HashtagPerformance.create({
          userId: userId,
          hashtag: hashtag,
          totalUses: 1,
          totalEngagement: totalEngagement,
          averageEngagement: totalEngagement,
          lastUsed: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error updating hashtag performance:', error);
    }
  }

  // Get hashtag performance analytics
  async getHashtagAnalytics(userId: string): Promise<any> {
    try {
      await connectToDatabase();

      const analytics = await HashtagPerformance.find({ userId: userId })
        .sort({ averageEngagement: -1 })
        .limit(50);

      return analytics.map((record) => ({
        hashtag: record.hashtag,
        total_uses: record.totalUses,
        average_engagement: record.averageEngagement,
        last_used: record.lastUsed,
      }));
    } catch (error) {
      logger.error('Error getting hashtag analytics:', error);
      return [];
    }
  }
}

export const hashtagService = new HashtagService();
