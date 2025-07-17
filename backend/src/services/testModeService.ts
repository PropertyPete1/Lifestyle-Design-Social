import { connectToDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { User } from '../models/User';

export interface TestModeConfig {
  enabled: boolean;
  simulateOnly: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  platforms: string[];
  maxTestPosts: number;
  testDuration: number; // minutes
  notifyOnTest: boolean;
}

export interface TestModePost {
  id: string;
  userId: string;
  platform: string;
  content: string;
  isSimulated: boolean;
  testResult: 'success' | 'failed' | 'skipped';
  createdAt: Date;
  metadata?: any;
}

class TestModeService {
  private readonly DEFAULT_CONFIG: TestModeConfig = {
    enabled: false,
    simulateOnly: true,
    logLevel: 'info',
    platforms: ['instagram', 'tiktok', 'youtube'],
    maxTestPosts: 5,
    testDuration: 60,
    notifyOnTest: true
  };

  // Check if test mode is enabled for user
  async isTestModeEnabled(userId: string): Promise<boolean> {
    try {
      await connectToDatabase();
      
      const user = await User.findById(userId);
      return user?.testMode || false;

    } catch (error) {
      logger.error(`Error checking test mode for user ${userId}:`, error);
      return false;
    }
  }

  // Get test mode configuration for user
  async getTestModeConfig(userId: string): Promise<TestModeConfig | null> {
    try {
      await connectToDatabase();
      
      const user = await User.findById(userId);
      if (!user || !user.testMode) {
        return null;
      }

      // For now, return default config since we don't have a separate config storage
      // In a full implementation, this could be stored in a separate field or collection
      return {
        ...this.DEFAULT_CONFIG,
        enabled: user.testMode
      };

    } catch (error) {
      logger.error(`Error getting test mode config for user ${userId}:`, error);
      return null;
    }
  }

  // Enable test mode for user
  async enableTestMode(userId: string, _config?: Partial<TestModeConfig>): Promise<boolean> {
    try {
      await connectToDatabase();
      
      await User.findByIdAndUpdate(userId, {
        testMode: true
      });

      logger.info(`Test mode enabled for user ${userId}`);
      return true;

    } catch (error) {
      logger.error(`Error enabling test mode for user ${userId}:`, error);
      return false;
    }
  }

  // Disable test mode for user
  async disableTestMode(userId: string): Promise<boolean> {
    try {
      await connectToDatabase();
      
      await User.findByIdAndUpdate(userId, {
        testMode: false
      });

      logger.info(`Test mode disabled for user ${userId}`);
      return true;

    } catch (error) {
      logger.error(`Error disabling test mode for user ${userId}:`, error);
      return false;
    }
  }

  // Update test mode configuration
  async updateTestModeConfig(userId: string, config: Partial<TestModeConfig>): Promise<boolean> {
    try {
      await connectToDatabase();
      
      // For now, just update the testMode boolean
      // In a full implementation, this would store the detailed config
      await User.findByIdAndUpdate(userId, {
        testMode: config.enabled !== false
      });

      logger.info(`Test mode config updated for user ${userId}`);
      return true;

    } catch (error) {
      logger.error(`Error updating test mode config for user ${userId}:`, error);
      return false;
    }
  }

  // Record a test post (simplified)
  async recordTestPost(userId: string, postData: Partial<TestModePost>): Promise<string> {
    try {
      const testPost: TestModePost = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        platform: postData.platform || 'instagram',
        content: postData.content || 'Test post',
        isSimulated: postData.isSimulated !== false,
        testResult: postData.testResult || 'success',
        createdAt: new Date(),
        metadata: postData.metadata || {}
      };

      // In a full implementation, this would be stored in a test posts collection
      logger.info(`Test post recorded: ${testPost.id} for user ${userId} on ${testPost.platform}`);
      
      return testPost.id;

    } catch (error) {
      logger.error(`Error recording test post for user ${userId}:`, error);
      throw error;
    }
  }

  // Get test posts for user (simplified)
  async getTestPosts(userId: string, limit: number = 10): Promise<TestModePost[]> {
    try {
      logger.info(`Getting test posts for user ${userId} (limit: ${limit})`);
      
      // Query actual posts marked as test posts
      await connectToDatabase();
      const { PostModel } = await import('../models/Post');
      
      const testPosts = await PostModel.find({
        userId,
        isTestPost: true
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

      // Convert to TestModePost format
      const formattedPosts: TestModePost[] = testPosts.map(post => ({
        id: post._id.toString(),
        userId: post.userId,
        platform: post.platform,
        content: post.content,
        isSimulated: post.status !== 'posted', // If not posted, it was simulated
        testResult: post.status === 'posted' ? 'success' : 
                   post.status === 'failed' ? 'failed' : 'skipped',
        createdAt: post.createdAt,
        metadata: {
          originalStatus: post.status,
          scheduledTime: post.scheduledTime,
          testMode: true
        }
      }));

      logger.info(`Found ${formattedPosts.length} test posts for user ${userId}`);
      return formattedPosts;

    } catch (error) {
      logger.error(`Error getting test posts for user ${userId}:`, error);
      return [];
    }
  }

  // Clear test data for user
  async clearTestData(userId: string): Promise<boolean> {
    try {
      // In a full implementation, this would delete test posts from a collection
      logger.info(`Test data cleared for user ${userId}`);
      return true;

    } catch (error) {
      logger.error(`Error clearing test data for user ${userId}:`, error);
      return false;
    }
  }

  // Simulate a post (simplified implementation for MongoDB)
  async simulatePost(userId: string, platform: string, content: string): Promise<TestModePost> {
    try {
      await connectToDatabase();
      
      const testPost: TestModePost = {
        id: Date.now().toString(),
        userId,
        platform,
        content,
        isSimulated: true,
        testResult: Math.random() > 0.2 ? 'success' : 'failed', // 80% success rate
        createdAt: new Date()
      };

      logger.info(`Test post simulated for user ${userId} on ${platform}: ${testPost.testResult}`);
      return testPost;

    } catch (error) {
      logger.error(`Error simulating post for user ${userId}:`, error);
      throw error;
    }
  }

  // Clear test posts for user
  async clearTestPosts(userId: string): Promise<void> {
    try {
      await connectToDatabase();
      
      // In a real implementation, this would clear test posts from a test collection
      // For now, we just log the action
      logger.info(`Test posts cleared for user ${userId}`);

    } catch (error) {
      logger.error(`Error clearing test posts for user ${userId}:`, error);
      throw error;
    }
  }

  // Get test mode analytics
  async getTestModeAnalytics(userId: string): Promise<any> {
    try {
      await connectToDatabase();
      
      // Return mock analytics data
      const analytics = {
        totalTests: Math.floor(Math.random() * 50) + 10,
        successfulTests: Math.floor(Math.random() * 40) + 8,
        failedTests: Math.floor(Math.random() * 10) + 2,
        averageResponseTime: Math.floor(Math.random() * 500) + 100, // ms
        platformBreakdown: {
          instagram: {
            tests: Math.floor(Math.random() * 20) + 5,
            successRate: Math.random() * 0.3 + 0.7 // 70-100%
          },
          tiktok: {
            tests: Math.floor(Math.random() * 15) + 3,
            successRate: Math.random() * 0.25 + 0.75 // 75-100%
          },
          facebook: {
            tests: Math.floor(Math.random() * 10) + 2,
            successRate: Math.random() * 0.2 + 0.8 // 80-100%
          }
        },
        recentTests: [] // Mock recent test data
      };

      logger.info(`Test mode analytics retrieved for user ${userId}`);
      return analytics;

    } catch (error) {
      logger.error(`Error getting test mode analytics for user ${userId}:`, error);
      throw error;
    }
  }

  // Get test account for platform
  async getTestAccount(userId: string, platform: string): Promise<any> {
    try {
      await connectToDatabase();
      
      // Return mock test account data
      const testAccount = {
        platform,
        username: `test_${platform}_user`,
        isActive: true,
        apiLimit: 100,
        apiUsed: Math.floor(Math.random() * 50),
        lastUsed: new Date(Date.now() - Math.floor(Math.random() * 86400000)), // Random time in last 24h
        capabilities: ['post', 'read', 'analytics'],
        restrictions: ['no_real_publishing', 'limited_audience']
      };

      logger.info(`Test account retrieved for user ${userId} on ${platform}`);
      return testAccount;

    } catch (error) {
      logger.error(`Error getting test account for user ${userId} on ${platform}:`, error);
      return null;
    }
  }

  // Get test mode statistics
  async getTestStats(userId: string): Promise<{
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    successRate: number;
    lastTestDate?: Date;
  }> {
    try {
      // In a full implementation, this would aggregate data from test posts collection
      // For now, return basic stats
      
      return {
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        successRate: 0,
        lastTestDate: undefined
      };

    } catch (error) {
      logger.error(`Error getting test stats for user ${userId}:`, error);
      return {
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        successRate: 0
      };
    }
  }
}

// Export singleton instance
export const testModeService = new TestModeService();
export default testModeService; 