// import { connectToDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { PostModel, IPost } from '../models/Post';

export interface EngagementUpdate {
  postId: string;
  platform: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    reach?: number;
    impressions?: number;
  };
  timestamp: Date;
}

export interface EngagementHistory {
  postId: string;
  platform: string;
  timestamp: Date;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    reach?: number;
    impressions?: number;
  };
}

export class EngagementTrackingService {
  // Store engagement update
  async trackEngagement(update: EngagementUpdate): Promise<void> {
    try {
      logger.info(`Tracking engagement for post ${update.postId} on ${update.platform}`);

      // Update the post's current engagement metrics
      await PostModel.findByIdAndUpdate(
        update.postId,
        {
          $set: {
            'engagementMetrics.likes': update.metrics.likes,
            'engagementMetrics.comments': update.metrics.comments,
            'engagementMetrics.shares': update.metrics.shares,
            'engagementMetrics.views': update.metrics.views,
            'engagementMetrics.reach': update.metrics.reach || 0,
            'engagementMetrics.impressions': update.metrics.impressions || 0,
            updatedAt: update.timestamp
          }
        },
        { new: true }
      );

      // Store historical engagement data
      await this.storeEngagementHistory(update);

      logger.info(`Successfully tracked engagement for post ${update.postId}`);

    } catch (error) {
      logger.error('Error tracking engagement:', error);
      throw new Error('Failed to track engagement metrics');
    }
  }

  // Get engagement history for a post
  async getEngagementHistory(postId: string): Promise<EngagementHistory[]> {
    try {
      logger.info(`Getting engagement history for post ${postId}`);

      // Get the post with all its engagement data
      const post = await PostModel.findById(postId).lean();
      
      if (!post) {
        logger.warn(`Post ${postId} not found`);
        return [];
      }

      // Convert post engagement data to history format
      const history: EngagementHistory[] = [];
      
      if (post.engagementMetrics) {
        // Use the actual engagementMetrics from the Post model
        history.push({
          postId: postId,
          platform: post.platform,
          timestamp: post.updatedAt || post.createdAt,
          metrics: {
            likes: post.engagementMetrics.likes || 0,
            comments: post.engagementMetrics.comments || 0,
            shares: post.engagementMetrics.shares || 0,
            views: post.engagementMetrics.views || 0,
            reach: post.engagementMetrics.reach || 0,
            impressions: post.engagementMetrics.impressions || 0
          }
        });
      }

      logger.info(`Found ${history.length} engagement records for post ${postId}`);
      return history;

    } catch (error) {
      logger.error(`Error getting engagement history for post ${postId}:`, error);
      return [];
    }
  }

  // Get top performing posts
  async getTopPerformingPosts(limit: number = 50): Promise<IPost[]> {
    try {
      logger.info(`Getting top ${limit} performing posts`);

      // Get posts sorted by total engagement (likes + comments + shares + views)
      const posts = await PostModel.aggregate([
        {
          $addFields: {
            totalEngagement: {
              $add: [
                { $ifNull: ["$engagementMetrics.likes", 0] },
                { $ifNull: ["$engagementMetrics.comments", 0] },
                { $ifNull: ["$engagementMetrics.shares", 0] },
                { $ifNull: ["$engagementMetrics.views", 0] }
              ]
            }
          }
        },
        { $sort: { totalEngagement: -1 } },
        { $limit: limit }
      ]);

      logger.info(`Found ${posts.length} top performing posts`);
      return posts;

    } catch (error) {
      logger.error('Error getting top performing posts:', error);
      return [];
    }
  }

  // Update post engagement metrics
  async updatePostEngagement(postId: string, platform: string, metrics: any): Promise<void> {
    try {
      logger.info(`Updating engagement for post ${postId} on ${platform}`);

      await PostModel.findByIdAndUpdate(
        postId,
        {
          $set: {
            'engagementMetrics': metrics,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      logger.info(`Successfully updated engagement for post ${postId} on ${platform}`);

    } catch (error) {
      logger.error(`Error updating post engagement for ${postId}:`, error);
      throw new Error('Failed to update post engagement metrics');
    }
  }

  /**
   * Store engagement history in post document
   * This could be extended to use a separate EngagementHistory collection if needed
   */
  private async storeEngagementHistory(update: EngagementUpdate): Promise<void> {
    try {
      // For now, we store engagement data directly in the post document
      // In a more complex system, this could be a separate collection
      
      // For now, we store engagement data directly in the post document
      // In a more complex system, this could be a separate EngagementHistory collection
      logger.debug(`Would store engagement history for post ${update.postId}:`, {
        platform: update.platform,
        timestamp: update.timestamp,
        metrics: update.metrics
      });

      logger.debug(`Stored engagement history for post ${update.postId}`);

    } catch (error) {
      logger.error('Error storing engagement history:', error);
      // Don't throw here, as the main engagement tracking should still succeed
    }
  }

  /**
   * Calculate engagement rate for a post
   */
     async calculateEngagementRate(postId: string, platform: string): Promise<number> {
     try {
       const post = await PostModel.findById(postId).lean();
       
       if (!post || !post.engagementMetrics) {
         return 0;
       }

       const metrics = post.engagementMetrics;
       const totalEngagement = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
       const impressions = metrics.impressions || metrics.views || 1;

       return totalEngagement / impressions;

     } catch (error) {
       logger.error(`Error calculating engagement rate for post ${postId}:`, error);
       return 0;
     }
   }
}

export default EngagementTrackingService; 