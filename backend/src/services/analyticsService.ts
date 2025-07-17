import { logger } from '../utils/logger';
import { Post, IPost } from '../models/Post';
import { Video } from '../models/Video';

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  reach: number;
  impressions: number;
  engagementRate?: number;
}

export interface AnalyticsData {
  totalPosts: number;
  totalEngagement: number;
  averageEngagementRate: number;
  bestPerformingPosts: IPost[];
  postingTrends: PostingTrend[];
  categoryPerformance: Record<string, CategoryStats>;
  timeAnalysis: PostingTimeAnalysis[];
}

export interface PostingTrend {
  date: string;
  posts: number;
  engagement: number;
  averageEngagement: number;
}

export interface CategoryStats {
  totalVideos: number;
  totalPosts: number;
  totalEngagement: number;
  averageEngagementRate: number;
}

export interface PostingTimeAnalysis {
  hour: number;
  averageEngagement: number;
  postCount: number;
}

export class AnalyticsService {
  private postModel: typeof Post;
  private videoModel: typeof Video;

  constructor() {
    this.postModel = Post;
    this.videoModel = Video;
  }

  /**
   * Record post engagement metrics
   */
  async recordPostEngagement(postId: string, metrics: EngagementMetrics): Promise<void> {
    try {
      logger.info(`Recording engagement for post ${postId}`);

      // Calculate engagement rate
      const engagementRate = this.calculateEngagementRate(metrics);

      // Update post with engagement data
      await this.postModel.findByIdAndUpdate(postId, {
        engagementMetrics: {
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          views: metrics.views,
          reach: metrics.reach,
          impressions: metrics.impressions,
        },
      });

      logger.info(`Recorded engagement for post ${postId}: ${engagementRate.toFixed(2)}%`);
    } catch (error) {
      logger.error('Failed to record post engagement:', error);
      throw error;
    }
  }

  /**
   * Calculate engagement rate
   */
  private calculateEngagementRate(metrics: EngagementMetrics): number {
    const totalEngagement = metrics.likes + metrics.comments + metrics.shares;
    const reach = metrics.reach || metrics.impressions || 1000; // Fallback if no reach data
    
    return (totalEngagement / reach) * 100;
  }

  /**
   * Get analytics data for a user
   */
  async getUserAnalytics(userId: string, days: number = 30): Promise<AnalyticsData> {
    try {
      logger.info(`Getting analytics for user ${userId} (${days} days)`);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get posts for the period
      const posts = await this.postModel.find({
        userId,
        status: 'posted',
        postedTime: { $gte: startDate, $lte: new Date() }
      });

      // Calculate analytics
      const totalPosts = posts.length;
      const totalEngagement = posts.reduce((sum: number, post: any) => {
        const metrics = post.engagementMetrics;
        return sum + (metrics?.likes || 0) + (metrics?.comments || 0) + (metrics?.shares || 0);
      }, 0);

      const averageEngagementRate = posts.length > 0 
        ? posts.reduce((sum: number, post: any) => {
            const metrics = post.engagementMetrics;
            if (!metrics) return sum;
            const engagement = metrics.likes + metrics.comments + metrics.shares;
            const reach = metrics.reach || metrics.impressions || 1000;
            return sum + (engagement / reach) * 100;
          }, 0) / posts.length
        : 0;

      // Get best performing posts
      const bestPerformingPosts = posts
        .filter((post: any) => post.engagementMetrics)
        .sort((a: any, b: any) => {
          const aRate = this.calculatePostEngagementRate(a);
          const bRate = this.calculatePostEngagementRate(b);
          return bRate - aRate;
        })
        .slice(0, 5);

      // Analyze posting trends
      const postingTrends = this.analyzePostingTrends(posts);

      // Analyze category performance
      const categoryPerformance = await this.analyzeCategoryPerformance(userId, startDate);

      // Analyze posting times
      const timeAnalysis = this.analyzePostingTimes(posts);

      return {
        totalPosts,
        totalEngagement,
        averageEngagementRate,
        bestPerformingPosts,
        postingTrends,
        categoryPerformance,
        timeAnalysis,
      };
    } catch (error) {
      logger.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate engagement rate for a post
   */
  private calculatePostEngagementRate(post: IPost): number {
    const metrics = post.engagementMetrics;
    if (!metrics) return 0;
    
    const totalEngagement = metrics.likes + metrics.comments + metrics.shares;
    const reach = metrics.reach || metrics.impressions || 1000;
    
    return (totalEngagement / reach) * 100;
  }

  /**
   * Analyze posting trends
   */
  private analyzePostingTrends(posts: IPost[]): PostingTrend[] {
    const trends: PostingTrend[] = [];
    const dailyStats: Record<string, { posts: number; engagement: number }> = {};

    // Group posts by date
    posts.forEach(post => {
      const date = post.postedTime ? new Date(post.postedTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      if (date) {
        if (!dailyStats[date]) {
          dailyStats[date] = { posts: 0, engagement: 0 };
        }
        dailyStats[date].posts++;
        
        const metrics = post.engagementMetrics;
        if (metrics) {
          dailyStats[date].engagement += metrics.likes + metrics.comments + metrics.shares;
        }
      }
    });

    // Convert to array and sort by date
    Object.entries(dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, stats]) => {
        trends.push({
          date,
          posts: stats.posts,
          engagement: stats.engagement,
          averageEngagement: stats.posts > 0 ? stats.engagement / stats.posts : 0,
        });
      });

    return trends;
  }

  /**
   * Analyze category performance
   */
  private async analyzeCategoryPerformance(userId: string, startDate: Date): Promise<Record<string, CategoryStats>> {
    try {
      const videos = await this.videoModel.find({ userId });
      const posts = await this.postModel.find({ 
        userId, 
        postedTime: { $gte: startDate } 
      });

      const categoryStats: Record<string, CategoryStats> = {};

      // Group by category
      videos.forEach((video: any) => {
        const category = video.category;
        if (!categoryStats[category]) {
          categoryStats[category] = {
            totalVideos: 0,
            totalPosts: 0,
            totalEngagement: 0,
            averageEngagementRate: 0,
          };
        }
        categoryStats[category].totalVideos++;
      });

      // Add post data
      posts.forEach((post: any) => {
        const video = videos.find((v: any) => v.id === post.videoId);
        if (video) {
          const category = video.category;
          const categoryData = categoryStats[category];
          if (categoryData) {
            categoryData.totalPosts++;
            const metrics = post.engagementMetrics;
            if (metrics) {
              categoryData.totalEngagement += 
                metrics.likes + metrics.comments + metrics.shares;
            }
          }
        }
      });

      // Calculate averages
      Object.values(categoryStats).forEach(stats => {
        if (stats.totalPosts > 0) {
          stats.averageEngagementRate = stats.totalEngagement / stats.totalPosts;
        }
      });

      return categoryStats;
    } catch (error) {
      logger.error('Failed to analyze category performance:', error);
      // Return default category stats structure instead of empty object
      return {
        'real-estate': {
          totalVideos: 0,
          totalPosts: 0,
          totalEngagement: 0,
          averageEngagementRate: 0,
        },
        'cartoon': {
          totalVideos: 0,
          totalPosts: 0,
          totalEngagement: 0,
          averageEngagementRate: 0,
        }
      };
    }
  }

  /**
   * Analyze posting times
   */
  private analyzePostingTimes(posts: IPost[]): PostingTimeAnalysis[] {
    const hourlyStats: Record<number, { engagement: number; count: number }> = {};

    // Initialize hourly stats
    for (let hour = 0; hour < 24; hour++) {
      hourlyStats[hour] = { engagement: 0, count: 0 };
    }

    // Group posts by hour
    posts.forEach(post => {
      const hour = post.postedTime ? new Date(post.postedTime).getHours() : 0;
      const metrics = post.engagementMetrics;
      const engagement = metrics ? metrics.likes + metrics.comments + metrics.shares : 0;
      
      if (hourlyStats[hour]) {
        hourlyStats[hour].engagement += engagement;
        hourlyStats[hour].count++;
      }
    });

    // Convert to array and calculate averages
    return Object.entries(hourlyStats).map(([hour, stats]) => ({
      hour: parseInt(hour),
      averageEngagement: stats.count > 0 ? stats.engagement / stats.count : 0,
      postCount: stats.count,
    }));
  }

  /**
   * Get best posting times based on engagement data
   */
  async getBestPostingTimes(userId: string, days: number = 90): Promise<{
    bestTimes: string[];
    timeAnalysis: PostingTimeAnalysis[];
    totalPostsAnalyzed: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const posts = await this.postModel.find({
        userId,
        status: 'posted',
        postedTime: { $gte: startDate, $lte: new Date() }
      });

      const timeAnalysis = this.analyzePostingTimes(posts);
      
      // Sort by average engagement and get top times
      const bestTimes = timeAnalysis
        .filter(time => time.postCount >= 3) // Only consider times with at least 3 posts
        .sort((a, b) => b.averageEngagement - a.averageEngagement)
        .slice(0, 5)
        .map(time => `${time.hour.toString().padStart(2, '0')}:00`);

      return {
        bestTimes,
        timeAnalysis,
        totalPostsAnalyzed: posts.length,
      };
    } catch (error) {
      logger.error('Failed to get best posting times:', error);
      return {
        bestTimes: ['09:00', '13:00', '18:00'],
        timeAnalysis: [],
        totalPostsAnalyzed: 0,
      };
    }
  }

  /**
   * Get engagement insights
   */
  async getEngagementInsights(userId: string, days: number = 30): Promise<{
    overallPerformance: {
      totalPosts: number;
      totalEngagement: number;
      averageEngagementRate: number;
      trend: string;
    };
    topPerformers: IPost[];
    categoryInsights: Record<string, CategoryStats>;
    timeInsights: PostingTimeAnalysis[];
    recommendations: string[];
  }> {
    try {
      const analytics = await this.getUserAnalytics(userId, days);
      
      const insights = {
        overallPerformance: {
          totalPosts: analytics.totalPosts,
          totalEngagement: analytics.totalEngagement,
          averageEngagementRate: analytics.averageEngagementRate,
          trend: this.calculateTrend(analytics.postingTrends),
        },
        topPerformers: analytics.bestPerformingPosts.slice(0, 3),
        categoryInsights: analytics.categoryPerformance,
        timeInsights: analytics.timeAnalysis,
        recommendations: this.generateRecommendations(analytics),
      };

      return insights;
    } catch (error) {
      logger.error('Failed to get engagement insights:', error);
      throw error;
    }
  }

  /**
   * Calculate trend (positive/negative/stable)
   */
  private calculateTrend(trends: PostingTrend[]): string {
    if (trends.length < 14) return 'stable';

    const recent = trends.slice(-7); // Last 7 days
    const previous = trends.slice(-14, -7); // 7 days before that

    if (recent.length === 0 || previous.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, day) => sum + day.averageEngagement, 0) / recent.length;
    const previousAvg = previous.reduce((sum, day) => sum + day.averageEngagement, 0) / previous.length;

    if (previousAvg === 0) return 'stable';

    const change = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (change > 10) return 'positive';
    if (change < -10) return 'negative';
    return 'stable';
  }

  /**
   * Generate recommendations based on analytics
   */
  private generateRecommendations(analytics: AnalyticsData): string[] {
    const recommendations: string[] = [];

    // Engagement rate recommendations
    if (analytics.averageEngagementRate < 2) {
      recommendations.push('Consider posting more engaging content with better captions and hashtags');
    } else if (analytics.averageEngagementRate > 5) {
      recommendations.push('Great engagement! Keep up the quality content');
    }

    // Posting frequency recommendations
    if (analytics.totalPosts < 10) {
      recommendations.push('Increase posting frequency to build audience engagement');
    }

    // Category recommendations
    const categories = Object.entries(analytics.categoryPerformance);
    if (categories.length > 1) {
      const bestCategory = categories.reduce((best, current) => 
        current[1].averageEngagementRate > best[1].averageEngagementRate ? current : best
      );
      recommendations.push(`Focus more on ${bestCategory[0]} content as it performs best`);
    }

    // Time recommendations
    const bestTimes = analytics.timeAnalysis
      .filter(time => time.postCount >= 3)
      .sort((a, b) => b.averageEngagement - a.averageEngagement)
      .slice(0, 3);
    
    if (bestTimes.length > 0) {
      const timeRecommendation = `Post more during these hours: ${bestTimes.map(t => `${t.hour}:00`).join(', ')}`;
      recommendations.push(timeRecommendation);
    }

    return recommendations;
  }

  /**
   * Get video performance analytics
   */
  async getVideoPerformance(videoId: string): Promise<{
    totalPosts: number;
    totalEngagement: number;
    averageEngagementRate: number;
    bestPost: IPost | null;
    posts: IPost[];
  }> {
    try {
      // Get all posts for this video - we'll need to implement this differently
      // For now, we'll get all posts and filter by videoId
      const posts = await this.postModel.find({ videoId });
      
      if (posts.length === 0) {
        return {
          totalPosts: 0,
          totalEngagement: 0,
          averageEngagementRate: 0,
          bestPost: null,
          posts: [],
        };
      }

      const totalPosts = posts.length;
      const totalEngagement = posts.reduce((sum: any, post: any) => {
        const metrics = post.engagementMetrics;
        return sum + (metrics ? metrics.likes + metrics.comments + metrics.shares : 0);
      }, 0);

      const averageEngagementRate = posts.reduce((sum: any, post: any) => 
        sum + this.calculatePostEngagementRate(post), 0) / posts.length;

      const bestPost = posts.reduce((best: any, current: any) => 
        this.calculatePostEngagementRate(current) > this.calculatePostEngagementRate(best) ? current : best
      );

      return {
        totalPosts,
        totalEngagement,
        averageEngagementRate,
        bestPost,
        posts,
      };
    } catch (error) {
      logger.error('Failed to get video performance:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(userId: string, format: 'csv' | 'json' = 'json'): Promise<string> {
    try {
      const analytics = await this.getUserAnalytics(userId, 365); // Full year

      if (format === 'csv') {
        return this.convertToCSV(analytics);
      }

      return JSON.stringify(analytics, null, 2);
    } catch (error) {
      logger.error('Failed to export analytics:', error);
      throw error;
    }
  }

  /**
   * Convert analytics to CSV format
   */
  private convertToCSV(analytics: AnalyticsData): string {
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Posts', analytics.totalPosts.toString()],
      ['Total Engagement', analytics.totalEngagement.toString()],
      ['Average Engagement Rate', analytics.averageEngagementRate.toFixed(2)],
    ];

    // Add posting trends
    csvRows.push(['', '']);
    csvRows.push(['Date', 'Posts', 'Engagement', 'Average Engagement']);
    analytics.postingTrends.forEach(trend => {
      csvRows.push([
        trend.date,
        trend.posts.toString(),
        trend.engagement.toString(),
        trend.averageEngagement.toFixed(2),
      ]);
    });

    return csvRows.map(row => row.join(',')).join('\n');
  }

  /**
   * Alias for getVideoPerformance method for backward compatibility
   */
  async getVideoAnalytics(videoId: string) {
    return this.getVideoPerformance(videoId);
  }

  /**
   * Get analytics for a specific post
   */
  async getPostAnalytics(postId: string) {
    try {
      const post = await this.postModel.findById(postId);
      if (!post) {
        return null;
      }

      return {
        id: post._id,
        userId: post.userId,
        platform: post.platform,
        content: post.content,
        status: post.status,
        engagementMetrics: post.engagementMetrics || {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          reach: 0,
          impressions: 0
        },
        engagementRate: this.calculatePostEngagementRate(post as any),
        postedTime: post.postedTime,
        scheduledTime: post.scheduledTime
      };
    } catch (error) {
      logger.error('Error getting post analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance for backwards compatibility
export const analyticsService = new AnalyticsService();

export default AnalyticsService; 