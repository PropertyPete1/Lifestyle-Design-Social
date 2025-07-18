import { logger } from '../utils/logger';
import { connectToDatabase } from '../config/database';
import { EngagementAnalyticsModel } from '../models/EngagementAnalytics';
import { DynamicScheduleModel, IOptimalTime } from '../models/DynamicSchedule';
import { APIHealthLogModel } from '../models/APIHealthLog';

export interface PlatformEngagementData {
  platform: 'instagram' | 'tiktok' | 'youtube';
  hour: number;
  engagement_score: number;
  post_count: number;
  avg_likes: number;
  avg_comments: number;
  avg_shares: number;
  date: string;
}

export interface OptimalTime {
  hour: number;
  minute: number;
  engagement_score: number;
  confidence: number;
}

export interface BestTimesResult {
  instagram: OptimalTime[];
  tiktok: OptimalTime[];
  youtube: OptimalTime[];
  last_updated: string;
  data_points: number;
  fallback_used: boolean;
  last_engagement_update: string | null;
  api_status: {
    instagram: 'healthy' | 'degraded' | 'failed';
    tiktok: 'healthy' | 'degraded' | 'failed';
    youtube: 'healthy' | 'degraded' | 'failed';
  };
}

export class BestTimeToPostService {
  private apiHealthCache: Map<
    string,
    { status: 'healthy' | 'degraded' | 'failed'; lastCheck: Date }
  >;
  // private _fallbackThresholdHours: number = 24; // Use fallback if API fails for 24 hours

  constructor() {
    this.apiHealthCache = new Map();
    logger.info('BestTimeToPostService initialized with MongoDB support');
  }

  /**
   * Analyzes audience engagement data to determine optimal posting times
   * @param platform - Social media platform to analyze
   * @param days - Number of days to analyze (default: 30)
   * @returns Array of optimal posting times
   */
  async getOptimalPostingTimes(
    platform: 'instagram' | 'tiktok' | 'youtube',
    days: number = 30
  ): Promise<OptimalTime[]> {
    try {
      logger.info(`Analyzing optimal posting times for ${platform} over ${days} days`);

      // Get engagement data for the specified period
      const engagementData = await this.getEngagementData(platform, days);

      if (engagementData.length === 0) {
        logger.warn(`No engagement data found for ${platform}, using default times`);
        return this.getDefaultOptimalTimes(platform);
      }

      // Analyze hourly engagement patterns
      const hourlyEngagement = this.analyzeHourlyEngagement(engagementData);

      // Calculate confidence scores based on data volume
      const confidenceScores = this.calculateConfidenceScores(hourlyEngagement);

      // Select top 3 optimal times
      const optimalTimes = this.selectOptimalTimes(hourlyEngagement, confidenceScores);

      logger.info(`Found ${optimalTimes.length} optimal times for ${platform}`);
      return optimalTimes;
    } catch (error) {
      logger.error(`Error analyzing optimal posting times for ${platform}:`, error);
      return this.getDefaultOptimalTimes(platform);
    }
  }

  /**
   * Gets optimal posting times for all platforms
   */
  async getAllOptimalTimes(days: number = 30): Promise<BestTimesResult> {
    try {
      const apiStatus = await this.checkAPIHealth();
      const shouldUseFallback = this.shouldUseFallback(apiStatus);

      let instagram: OptimalTime[];
      let tiktok: OptimalTime[];
      let youtube: OptimalTime[];

      if (shouldUseFallback) {
        logger.warn('Using fallback times due to API issues or insufficient data');
        instagram = this.getDefaultOptimalTimes('instagram');
        tiktok = this.getDefaultOptimalTimes('tiktok');
        youtube = this.getDefaultOptimalTimes('youtube');
      } else {
        [instagram, tiktok, youtube] = await Promise.all([
          this.getOptimalPostingTimesWithFallback('instagram', days),
          this.getOptimalPostingTimesWithFallback('tiktok', days),
          this.getOptimalPostingTimesWithFallback('youtube', days),
        ]);
      }

      const totalDataPoints = await this.getTotalDataPoints(days);
      const lastEngagementUpdate = await this.getLastEngagementUpdate();

      return {
        instagram,
        tiktok,
        youtube,
        last_updated: new Date().toISOString(),
        data_points: totalDataPoints,
        fallback_used: shouldUseFallback,
        last_engagement_update: lastEngagementUpdate,
        api_status: apiStatus,
      };
    } catch (error) {
      logger.error('Error getting all optimal times:', error);

      // Return fallback times if everything fails
      return {
        instagram: this.getDefaultOptimalTimes('instagram'),
        tiktok: this.getDefaultOptimalTimes('tiktok'),
        youtube: this.getDefaultOptimalTimes('youtube'),
        last_updated: new Date().toISOString(),
        data_points: 0,
        fallback_used: true,
        last_engagement_update: null,
        api_status: {
          instagram: 'failed',
          tiktok: 'failed',
          youtube: 'failed',
        },
      };
    }
  }

  /**
   * Records engagement data for a post
   */
  async recordEngagementData(data: {
    platform: 'instagram' | 'tiktok' | 'youtube';
    post_id: string;
    posted_at: Date;
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  }): Promise<void> {
    try {
      await connectToDatabase();
      const hour = data.posted_at.getHours();
      const dateString = data.posted_at.toISOString().split('T')[0];
      const date = new Date(dateString + 'T00:00:00.000Z');

      // Calculate engagement score (normalized)
      const engagement_score = this.calculateEngagementScore({
        likes: data.likes,
        comments: data.comments,
        shares: data.shares,
        views: data.views || 0,
      });

      // Use upsert to replace existing data for the same platform/hour/date
      await EngagementAnalyticsModel.findOneAndUpdate(
        {
          platform: data.platform,
          hour,
          date,
        },
        {
          platform: data.platform,
          hour,
          date,
          engagementScore: engagement_score,
          postCount: 1,
          avgLikes: data.likes,
          avgComments: data.comments,
          avgShares: data.shares,
          avgViews: data.views || 0,
        },
        {
          upsert: true,
          new: true,
        }
      );

      logger.info(`Recorded engagement data for ${data.platform} at hour ${hour}`);
    } catch (error) {
      logger.error('Error recording engagement data:', error);
      throw error;
    }
  }

  /**
   * Updates posting schedule based on current optimal times
   */
  async updateDynamicSchedule(): Promise<void> {
    try {
      logger.info('Updating dynamic posting schedule based on audience activity');
      await connectToDatabase();

      const optimalTimes = await this.getAllOptimalTimes();

      // Convert OptimalTime[] to IOptimalTime[] for the model
      const convertTimes = (times: OptimalTime[]): IOptimalTime[] =>
        times.map((t) => ({
          hour: t.hour,
          minute: t.minute,
          engagement_score: t.engagement_score,
          confidence: t.confidence,
        }));

      // Create or update the latest schedule
      await DynamicScheduleModel.findOneAndUpdate(
        {}, // Find any existing schedule
        {
          instagramTimes: convertTimes(optimalTimes.instagram),
          tiktokTimes: convertTimes(optimalTimes.tiktok),
          youtubeTimes: convertTimes(optimalTimes.youtube),
          confidenceScore: this.calculateOverallConfidence(optimalTimes),
          dataPoints: optimalTimes.data_points,
          lastEngagementUpdate: optimalTimes.last_engagement_update
            ? new Date(optimalTimes.last_engagement_update)
            : undefined,
        },
        {
          upsert: true,
          new: true,
          sort: { updatedAt: -1 }, // Get the most recent one
        }
      );

      logger.info('Dynamic schedule updated successfully');
    } catch (error) {
      logger.error('Error updating dynamic schedule:', error);
      throw error;
    }
  }

  /**
   * Gets current dynamic schedule
   */
  async getCurrentSchedule(): Promise<BestTimesResult | null> {
    try {
      await connectToDatabase();

      const result = await DynamicScheduleModel.findOne().sort({ updatedAt: -1 }).lean();

      if (!result) {
        return null;
      }

      // Convert IOptimalTime[] back to OptimalTime[]
      const convertTimes = (times: IOptimalTime[]): OptimalTime[] =>
        times.map((t) => ({
          hour: t.hour,
          minute: t.minute,
          engagement_score: t.engagement_score,
          confidence: t.confidence,
        }));

      return {
        instagram: convertTimes(result.instagramTimes),
        tiktok: convertTimes(result.tiktokTimes),
        youtube: convertTimes(result.youtubeTimes),
        last_updated: result.updatedAt.toISOString(),
        data_points: result.dataPoints || 0,
        fallback_used: false,
        last_engagement_update: result.lastEngagementUpdate?.toISOString() || null,
        api_status: {
          instagram: 'healthy',
          tiktok: 'healthy',
          youtube: 'healthy',
        },
      };
    } catch (error) {
      logger.error('Error getting current schedule:', error);
      return null;
    }
  }

  // Private helper methods

  private async getEngagementData(
    platform: string,
    days: number
  ): Promise<PlatformEngagementData[]> {
    await connectToDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const results = await EngagementAnalyticsModel.find({
      platform,
      date: { $gte: cutoffDate },
    })
      .sort({ date: -1, hour: 1 })
      .lean();

    // Convert to the expected format
    return results.map((r) => ({
      platform: r.platform as 'instagram' | 'tiktok' | 'youtube',
      hour: r.hour,
      date: r.date.toISOString().split('T')[0] || '',
      engagement_score: r.engagementScore,
      post_count: r.postCount,
      avg_likes: r.avgLikes,
      avg_comments: r.avgComments,
      avg_shares: r.avgShares,
    }));
  }

  private analyzeHourlyEngagement(data: PlatformEngagementData[]): Map<number, number> {
    const hourlyScores = new Map<number, number>();

    // Initialize all hours
    for (let hour = 0; hour < 24; hour++) {
      hourlyScores.set(hour, 0);
    }

    // Aggregate engagement scores by hour
    const hourlyData = new Map<number, number[]>();

    data.forEach((entry) => {
      if (!hourlyData.has(entry.hour)) {
        hourlyData.set(entry.hour, []);
      }
      hourlyData.get(entry.hour)!.push(entry.engagement_score);
    });

    // Calculate average engagement score for each hour
    hourlyData.forEach((scores, hour) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      hourlyScores.set(hour, avgScore);
    });

    return hourlyScores;
  }

  private calculateConfidenceScores(hourlyEngagement: Map<number, number>): Map<number, number> {
    const confidenceScores = new Map<number, number>();
    const maxScore = Math.max(...Array.from(hourlyEngagement.values()));

    hourlyEngagement.forEach((score, hour) => {
      // Confidence based on relative performance and data availability
      const relativeScore = maxScore > 0 ? score / maxScore : 0;
      const confidence = Math.min(relativeScore * 100, 100);
      confidenceScores.set(hour, confidence);
    });

    return confidenceScores;
  }

  private selectOptimalTimes(
    hourlyEngagement: Map<number, number>,
    confidenceScores: Map<number, number>
  ): OptimalTime[] {
    const times: OptimalTime[] = [];

    // Convert to array and sort by engagement score
    const sortedHours = Array.from(hourlyEngagement.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3 hours

    sortedHours.forEach(([hour, score]) => {
      times.push({
        hour,
        minute: Math.floor(Math.random() * 60), // Random minute for variety
        engagement_score: score,
        confidence: confidenceScores.get(hour) || 0,
      });
    });

    return times;
  }

  private calculateEngagementScore(metrics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  }): number {
    // Weighted engagement score
    const commentWeight = 3; // Comments are more valuable
    const shareWeight = 5; // Shares are most valuable
    const likeWeight = 1; // Likes are baseline

    const totalEngagement =
      metrics.likes * likeWeight + metrics.comments * commentWeight + metrics.shares * shareWeight;

    // Normalize by views if available
    if (metrics.views > 0) {
      return (totalEngagement / metrics.views) * 100;
    }

    return totalEngagement;
  }

  private getDefaultOptimalTimes(platform: string): OptimalTime[] {
    const defaults = {
      instagram: [
        { hour: 9, minute: 0, engagement_score: 0, confidence: 50 },
        { hour: 13, minute: 0, engagement_score: 0, confidence: 50 },
        { hour: 18, minute: 0, engagement_score: 0, confidence: 50 },
      ],
      tiktok: [
        { hour: 11, minute: 0, engagement_score: 0, confidence: 50 },
        { hour: 15, minute: 0, engagement_score: 0, confidence: 50 },
        { hour: 19, minute: 0, engagement_score: 0, confidence: 50 },
      ],
      youtube: [
        { hour: 14, minute: 0, engagement_score: 0, confidence: 50 },
        { hour: 17, minute: 0, engagement_score: 0, confidence: 50 },
        { hour: 20, minute: 0, engagement_score: 0, confidence: 50 },
      ],
    };

    return defaults[platform as keyof typeof defaults] || defaults.instagram;
  }

  private async getTotalDataPoints(days: number): Promise<number> {
    await connectToDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const count = await EngagementAnalyticsModel.countDocuments({
      date: { $gte: cutoffDate },
    });

    return count || 0;
  }

  private calculateOverallConfidence(optimalTimes: BestTimesResult): number {
    const allTimes = [...optimalTimes.instagram, ...optimalTimes.tiktok, ...optimalTimes.youtube];

    if (allTimes.length === 0) return 0;

    const avgConfidence =
      allTimes.reduce((sum, time) => sum + time.confidence, 0) / allTimes.length;
    return Math.round(avgConfidence);
  }

  /**
   * Check API health status for all platforms
   */
  private async checkAPIHealth(): Promise<{
    instagram: 'healthy' | 'degraded' | 'failed';
    tiktok: 'healthy' | 'degraded' | 'failed';
    youtube: 'healthy' | 'degraded' | 'failed';
  }> {
    const platforms = ['instagram', 'tiktok', 'youtube'] as const;
    const status = {} as any;

    for (const platform of platforms) {
      const cached = this.apiHealthCache.get(platform);
      const now = new Date();

      // Check if we have recent health data (within last hour)
      if (cached && now.getTime() - cached.lastCheck.getTime() < 60 * 60 * 1000) {
        status[platform] = cached.status;
        continue;
      }

      try {
        // Try to get recent engagement data to test API health
        const recentData = await this.getEngagementData(platform, 1);
        const lastUpdate = await this.getLastEngagementUpdateForPlatform(platform);

        // Check if we have recent data (within last 48 hours)
        if (lastUpdate && now.getTime() - new Date(lastUpdate).getTime() < 48 * 60 * 60 * 1000) {
          status[platform] = 'healthy';
        } else if (recentData.length > 0) {
          status[platform] = 'degraded';
        } else {
          status[platform] = 'failed';
        }
      } catch (error) {
        logger.error(`Error checking API health for ${platform}:`, error);
        status[platform] = 'failed';
      }

      // Cache the result
      this.apiHealthCache.set(platform, {
        status: status[platform],
        lastCheck: now,
      });
    }

    return status;
  }

  /**
   * Determine if we should use fallback times
   */
  private shouldUseFallback(apiStatus: {
    instagram: 'healthy' | 'degraded' | 'failed';
    tiktok: 'healthy' | 'degraded' | 'failed';
    youtube: 'healthy' | 'degraded' | 'failed';
  }): boolean {
    const failedPlatforms = Object.values(apiStatus).filter((status) => status === 'failed').length;
    const degradedPlatforms = Object.values(apiStatus).filter(
      (status) => status === 'degraded'
    ).length;

    // Use fallback if more than 2 platforms are failed, or all platforms are degraded/failed
    return failedPlatforms > 2 || failedPlatforms + degradedPlatforms === 3;
  }

  /**
   * Get optimal posting times with fallback logic
   */
  private async getOptimalPostingTimesWithFallback(
    platform: 'instagram' | 'tiktok' | 'youtube',
    days: number = 30
  ): Promise<OptimalTime[]> {
    try {
      const optimalTimes = await this.getOptimalPostingTimes(platform, days);

      // If we got valid times with good confidence, use them
      if (optimalTimes.length > 0 && optimalTimes.some((time) => time.confidence > 30)) {
        return optimalTimes;
      }

      // Otherwise use fallback
      logger.warn(`Low confidence data for ${platform}, using fallback times`);
      return this.getDefaultOptimalTimes(platform);
    } catch (error) {
      logger.error(`Error getting optimal times for ${platform}, using fallback:`, error);
      return this.getDefaultOptimalTimes(platform);
    }
  }

  /**
   * Get the last time engagement data was updated
   */
  private async getLastEngagementUpdate(): Promise<string | null> {
    try {
      await connectToDatabase();

      const result = await EngagementAnalyticsModel.findOne()
        .sort({ createdAt: -1 })
        .select('createdAt')
        .lean();

      return result?.createdAt?.toISOString() || null;
    } catch (error) {
      logger.error('Error getting last engagement update:', error);
      return null;
    }
  }

  /**
   * Get the last time engagement data was updated for a specific platform
   */
  private async getLastEngagementUpdateForPlatform(platform: string): Promise<string | null> {
    try {
      await connectToDatabase();

      const result = await EngagementAnalyticsModel.findOne({ platform })
        .sort({ createdAt: -1 })
        .select('createdAt')
        .lean();

      return result?.createdAt?.toISOString() || null;
    } catch (error) {
      logger.error(`Error getting last engagement update for ${platform}:`, error);
      return null;
    }
  }

  /**
   * Record API failure for health monitoring
   */
  async recordAPIFailure(platform: 'instagram' | 'tiktok' | 'youtube', error: any): Promise<void> {
    try {
      logger.warn(`API failure recorded for ${platform}:`, error);

      // Update health cache
      this.apiHealthCache.set(platform, {
        status: 'failed',
        lastCheck: new Date(),
      });

      // Store in database for historical tracking
      try {
        await connectToDatabase();
        await APIHealthLogModel.create({
          platform,
          status: 'failed',
          errorMessage: error.message || 'Unknown error',
        });
      } catch (dbError) {
        logger.error('Error recording API failure to database:', dbError);
        // Don't fail the main operation if logging fails
      }
    } catch (error) {
      logger.error('Error recording API failure:', error);
    }
  }

  /**
   * Get fallback status and health information
   */
  async getSystemHealth(): Promise<{
    overall_status: 'healthy' | 'degraded' | 'failed';
    api_status: {
      instagram: 'healthy' | 'degraded' | 'failed';
      tiktok: 'healthy' | 'degraded' | 'failed';
      youtube: 'healthy' | 'degraded' | 'failed';
    };
    fallback_active: boolean;
    last_engagement_update: string | null;
    data_freshness_hours: number | null;
  }> {
    try {
      const apiStatus = await this.checkAPIHealth();
      const fallbackActive = this.shouldUseFallback(apiStatus);
      const lastUpdate = await this.getLastEngagementUpdate();

      let dataFreshnessHours: number | null = null;
      if (lastUpdate) {
        const now = new Date();
        const lastUpdateDate = new Date(lastUpdate);
        dataFreshnessHours = Math.round(
          (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60)
        );
      }

      // Determine overall status
      const healthyCount = Object.values(apiStatus).filter((status) => status === 'healthy').length;
      const degradedCount = Object.values(apiStatus).filter(
        (status) => status === 'degraded'
      ).length;

      let overallStatus: 'healthy' | 'degraded' | 'failed';
      if (healthyCount >= 2) {
        overallStatus = 'healthy';
      } else if (healthyCount + degradedCount >= 2) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'failed';
      }

      return {
        overall_status: overallStatus,
        api_status: apiStatus,
        fallback_active: fallbackActive,
        last_engagement_update: lastUpdate,
        data_freshness_hours: dataFreshnessHours,
      };
    } catch (error) {
      logger.error('Error getting system health:', error);
      return {
        overall_status: 'failed',
        api_status: {
          instagram: 'failed',
          tiktok: 'failed',
          youtube: 'failed',
        },
        fallback_active: true,
        last_engagement_update: null,
        data_freshness_hours: null,
      };
    }
  }
}

export const bestTimeToPostService = new BestTimeToPostService();
