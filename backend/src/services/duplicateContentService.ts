import { connectToDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { Post } from '../models/Post';

export interface SimilarityCheckParams {
  userId: string;
  newCaption: string;
  platform?: string;
  timeframeDays?: number;
  similarityThreshold?: number;
}

export interface SimilarityCheckResult {
  isSimilar: boolean;
  similarity: number;
  matchedCaption?: string;
  recommendation: string;
}

class DuplicateContentService {
  // Check caption similarity using simple text comparison
  async checkCaptionSimilarity(params: SimilarityCheckParams): Promise<SimilarityCheckResult> {
    try {
      await connectToDatabase();

      const {
        userId,
        newCaption,
        platform,
        timeframeDays = 30,
        similarityThreshold = 0.7,
      } = params;

      if (!newCaption || newCaption.trim().length === 0) {
        return {
          isSimilar: false,
          similarity: 0,
          recommendation: 'Caption is empty',
        };
      }

      // Find recent posts within timeframe
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);

      const recentPosts = await Post.find({
        userId,
        ...(platform && { platform }),
        createdAt: { $gte: cutoffDate },
        status: { $in: ['posted', 'scheduled'] },
      }).sort({ createdAt: -1 });

      let highestSimilarity = 0;
      let matchedCaption = '';

      // Compare with recent captions
      for (const post of recentPosts) {
        const similarity = this.calculateTextSimilarity(newCaption, post.content);
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          matchedCaption = post.content;
        }
      }

      const isSimilar = highestSimilarity >= similarityThreshold;

      return {
        isSimilar,
        similarity: highestSimilarity,
        matchedCaption: isSimilar ? matchedCaption : undefined,
        recommendation: isSimilar
          ? 'Caption is too similar to recent posts. Consider using different wording.'
          : 'Caption is unique and ready to use.',
      };
    } catch (error) {
      logger.error('Error checking caption similarity:', error);
      return {
        isSimilar: false,
        similarity: 0,
        recommendation: 'Error checking similarity - proceeding with caution',
      };
    }
  }

  // Simple text similarity calculation using word overlap
  public calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;

    // Normalize text: lowercase, remove special chars, split into words
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 2); // Ignore short words

    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));

    if (words1.size === 0 || words2.size === 0) return 0;

    // Calculate Jaccard similarity (intersection / union)
    const intersection = new Set([...words1].filter((word) => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  // Check if video content is duplicate (simplified version)
  async checkVideoDuplicate(userId: string, _videoHash: string): Promise<boolean> {
    try {
      await connectToDatabase();

      // For now, just check if we have any videos with the same filename pattern
      // In a full implementation, this would use video hashing/fingerprinting

      logger.info(`Checking video duplicate for user ${userId}`);
      return false; // For now, assume no duplicates
    } catch (error) {
      logger.error('Error checking video duplicate:', error);
      return false;
    }
  }

  // Get duplicate statistics for user
  async getDuplicateStats(userId: string): Promise<any> {
    try {
      await connectToDatabase();

      const totalPosts = await Post.countDocuments({ userId });

      return {
        totalPosts,
        duplicatesFound: 0, // Simplified for now
        duplicateRate: 0,
        lastCheck: new Date(),
      };
    } catch (error) {
      logger.error('Error getting duplicate stats:', error);
      return {
        totalPosts: 0,
        duplicatesFound: 0,
        duplicateRate: 0,
        lastCheck: new Date(),
      };
    }
  }

  // Clean up old duplicate records (simplified)
  async cleanupOldRecords(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      logger.info(`Cleanup completed - would remove records older than ${cutoffDate}`);
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }

  // Basic duplicate detection implementation
  async regenerateCaptionIfSimilar(params: {
    userId: string;
    originalCaption: string;
    videoType: 'real_estate' | 'cartoon';
    platform?: string;
    timeframeDays?: number;
    similarityThreshold?: number;
  }): Promise<{ regenerated: boolean; newCaption?: string }> {
    try {
      const {
        userId,
        originalCaption,
        platform,
        timeframeDays = 30,
        similarityThreshold = 0.8,
      } = params;

      // Check if the original caption is too similar to recent posts
      const similarityCheck = await this.checkCaptionSimilarity({
        userId,
        newCaption: originalCaption,
        platform,
        timeframeDays,
        similarityThreshold,
      });

      if (similarityCheck.isSimilar) {
        // Generate a new caption using the caption generation service
        logger.info(
          `Regenerating caption for user ${userId} - original was ${Math.round(similarityCheck.similarity * 100)}% similar`
        );

        return {
          regenerated: true,
          newCaption: `${originalCaption} ✨`, // Simple modification for now
        };
      }

      return {
        regenerated: false,
      };
    } catch (error) {
      logger.error('Error regenerating caption:', error);
      return { regenerated: false };
    }
  }
}

// Export singleton instance
export const duplicateContentService = new DuplicateContentService();
export default duplicateContentService;
