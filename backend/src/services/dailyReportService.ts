import { connectToDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { Post } from '../models/Post';
import { User } from '../models/User';
// import { Video } from '../models/Video';
import * as nodemailer from 'nodemailer';

export interface DailyReportData {
  date: string;
  userId: string;
  userName: string;
  userEmail: string;
  summary: {
    totalPosts: number;
    successfulPosts: number;
    failedPosts: number;
    successRate: number;
  };
  platforms: {
    instagram: PlatformStats;
    tiktok: PlatformStats;
    youtube: PlatformStats;
  };
  engagement: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate: number;
  };
  topPerformingPosts: PostPerformance[];
  errors: ErrorSummary[];
  recommendations: string[];
}

export interface PlatformStats {
  posts: number;
  successful: number;
  failed: number;
  views: number;
  engagement: number;
}

export interface PostPerformance {
  id: string;
  platform: string;
  content: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
  postedAt: Date;
}

export interface ErrorSummary {
  type: string;
  count: number;
  lastOccurrence: Date;
  description: string;
}

class DailyReportService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeEmailTransporter();
  }

  // Initialize email transporter for reports
  private initializeEmailTransporter(): void {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  // Generate daily report for user
  async generateDailyReport(userId: string): Promise<DailyReportData> {
    try {
      await connectToDatabase();
      
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      // Get posts from yesterday
      const posts = await Post.find({
        userId,
        createdAt: {
          $gte: yesterday,
          $lt: today
        }
      });

      const totalPosts = posts.length;
      const successfulPosts = posts.filter(p => p.status === 'posted').length;
      const failedPosts = posts.filter(p => p.status === 'failed').length;
      
      // Mock engagement data - in real implementation would come from platform APIs
      const mockEngagement = {
        totalViews: Math.floor(Math.random() * 1000) + 100,
        totalLikes: Math.floor(Math.random() * 50) + 10,
        totalComments: Math.floor(Math.random() * 20) + 2,
        totalShares: Math.floor(Math.random() * 10) + 1,
        avgEngagementRate: Math.random() * 0.1 + 0.02 // 2-12%
      };

      const report: DailyReportData = {
        date: yesterday.toISOString().split('T')[0]!,
        userId,
        userName: user.username || user.name || 'Unknown User',
        userEmail: user.email,
        summary: {
          totalPosts,
          successfulPosts,
          failedPosts,
          successRate: totalPosts > 0 ? (successfulPosts / totalPosts) * 100 : 0
        },
        platforms: {
          instagram: {
            posts: posts.filter(p => p.platform === 'instagram').length,
            successful: posts.filter(p => p.platform === 'instagram' && p.status === 'posted').length,
            failed: posts.filter(p => p.platform === 'instagram' && p.status === 'failed').length,
            views: Math.floor(mockEngagement.totalViews * 0.4),
            engagement: Math.floor(mockEngagement.totalLikes * 0.4)
          },
          tiktok: {
            posts: posts.filter(p => p.platform === 'tiktok').length,
            successful: posts.filter(p => p.platform === 'tiktok' && p.status === 'posted').length,
            failed: posts.filter(p => p.platform === 'tiktok' && p.status === 'failed').length,
            views: Math.floor(mockEngagement.totalViews * 0.4),
            engagement: Math.floor(mockEngagement.totalLikes * 0.4)
          },
          youtube: {
            posts: 0, // YouTube not supported in Post model
            successful: 0,
            failed: 0,
            views: Math.floor(mockEngagement.totalViews * 0.2),
            engagement: Math.floor(mockEngagement.totalLikes * 0.2)
          }
        },
        engagement: mockEngagement,
        topPerformingPosts: posts.slice(0, 3).map(post => ({
          id: String(post._id),
          platform: post.platform,
          content: post.content.substring(0, 100) + '...',
          views: Math.floor(Math.random() * 500) + 50,
          likes: Math.floor(Math.random() * 25) + 5,
          comments: Math.floor(Math.random() * 10) + 1,
          engagementRate: Math.random() * 0.1 + 0.02,
          postedAt: post.postedTime || post.createdAt
        })),
        errors: [],
        recommendations: [
          'Consider posting during peak engagement hours (6-9 PM)',
          'Add more hashtags to increase discoverability',
          'Engage with comments to boost algorithm visibility'
        ]
      };

      logger.info(`Daily report generated for user ${userId}`);
      return report;

    } catch (error) {
      logger.error(`Error generating daily report for user ${userId}:`, error);
      throw error;
    }
  }

  // Calculate summary stats
  // private _calculateSummary(posts: any[]): {
  //   totalPosts: number;
  //   successfulPosts: number;
  //   failedPosts: number;
  //   successRate: number;
  // } {
  //   const totalPosts = posts.length;
  //   const successfulPosts = posts.filter(p => p.status === 'posted').length;
  //   const failedPosts = posts.filter(p => p.status === 'failed').length;
  //   const successRate = totalPosts > 0 ? (successfulPosts / totalPosts) * 100 : 0;
  //
  //   return {
  //     totalPosts,
  //     successfulPosts,
  //     failedPosts,
  //     successRate
  //   };
  // }

  // Calculate platform-specific stats
  // private _calculatePlatformStats(posts: any[]): {
  //   instagram: PlatformStats;
  //   tiktok: PlatformStats;
  //   youtube: PlatformStats;
  // } {
  //   const platforms = ['instagram', 'tiktok', 'youtube'] as const;
  //   
  //   const stats = {} as {
  //     instagram: PlatformStats;
  //     tiktok: PlatformStats;
  //     youtube: PlatformStats;
  //   };
  //
  //   for (const platform of platforms) {
  //     const platformPosts = posts.filter(p => p.platform === platform);
  //     const successful = platformPosts.filter(p => p.status === 'posted').length;
  //     const failed = platformPosts.filter(p => p.status === 'failed').length;
  //     const total = platformPosts.length;
  //     const rate = total > 0 ? (successful / total) * 100 : 0;
  //
  //     stats[platform] = {
  //       totalPosts: total,
  //       successfulPosts: successful,
  //       failedPosts: failed,
  //       successRate: Math.round(rate * 100) / 100,
  //       avgEngagement: 0,
  //       topPost: null
  //     };
  //   }
  //
  //   return stats;
  // }

  // Calculate engagement stats
  // private _calculateEngagementStats(posts: any[]): {
  //   totalViews: number;
  //   totalLikes: number;
  //   totalComments: number;
  //   totalShares: number;
  //   avgEngagementRate: number;
  // } {
  //   // Implementation would be here
  //   return {
  //     totalViews: 0,
  //     totalLikes: 0,
  //     totalComments: 0,
  //     totalShares: 0,
  //     avgEngagementRate: 0
  //   };
  // }

  // Get top performing posts
  // private _getTopPerformingPosts(posts: any[], limit: number = 5): PostPerformance[] {
  //   // Implementation would be here
  //   return [];
  // }

  // Get error summary
  // private _getErrorSummary(posts: any[]): ErrorSummary[] {
  //   // Implementation would be here
  //   return [];
  // }

  // private categorizeError(error: any): string {
  //   // Implementation would be here
  //   return 'unknown';
  // }

  // Generate recommendations
  // private _generateRecommendations(
  //   summary: any, 
  //   platforms: any, 
  //   engagement: any
  // ): string[] {
  //   // Implementation would be here
  //   return [];
  // }

  // Get basic report fallback
  // private _getBasicReport(userId: string): DailyReportData {
  //   // Implementation would be here
  //   return {
  //     date: new Date().toISOString().split('T')[0]!,
  //     userId,
  //     summary: { totalPosts: 0, successfulPosts: 0, failedPosts: 0, successRate: 0 },
  //     platforms: { instagram: { posts: 0, successful: 0, failed: 0, views: 0, engagement: 0 }, 
  //                  tiktok: { posts: 0, successful: 0, failed: 0, views: 0, engagement: 0 },
  //                  youtube: { posts: 0, successful: 0, failed: 0, views: 0, engagement: 0 } },
  //     engagement: { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, avgEngagementRate: 0 },
  //     topPosts: [],
  //     errors: [],
  //     recommendations: []
  //   };
  // }

  // Send daily report via email
  async sendDailyReport(userId: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        logger.warn('Email transporter not configured - skipping email report');
        return false;
      }

      const report = await this.generateDailyReport(userId);
      
      const emailContent = this.generateEmailContent(report);
      
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@realestateautoposting.com',
        to: report.userEmail,
        subject: `Daily Report - ${report.date}`,
        html: emailContent
      });

      logger.info(`Daily report sent to ${report.userEmail}`);
      return true;

    } catch (error) {
      logger.error(`Error sending daily report for user ${userId}:`, error);
      return false;
    }
  }

  // Generate email content
  private generateEmailContent(report: DailyReportData): string {
    return `
      <h2>Daily Report - ${report.date}</h2>
      <p>Hello ${report.userName},</p>
      
      <h3>Summary</h3>
      <ul>
        <li>Total Posts: ${report.summary.totalPosts}</li>
        <li>Successful: ${report.summary.successfulPosts}</li>
        <li>Failed: ${report.summary.failedPosts}</li>
        <li>Success Rate: ${report.summary.successRate}%</li>
      </ul>
      
      <h3>Engagement</h3>
      <ul>
        <li>Total Views: ${report.engagement.totalViews}</li>
        <li>Total Likes: ${report.engagement.totalLikes}</li>
        <li>Total Comments: ${report.engagement.totalComments}</li>
        <li>Avg Engagement Rate: ${report.engagement.avgEngagementRate}%</li>
      </ul>
      
      <h3>Recommendations</h3>
      <ul>
        ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
      
      <p>Best regards,<br>Real Estate Auto-Posting Team</p>
    `;
  }

  // Get historical reports
  async getHistoricalReports(userId: string, days: number = 30): Promise<DailyReportData[]> {
    try {
      await connectToDatabase();
      
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const reports: DailyReportData[] = [];
      const today = new Date();
      
      // Generate mock historical data for the requested number of days
      for (let i = 1; i <= days; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        // Get posts for this day
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const posts = await Post.find({
          userId,
          createdAt: {
            $gte: dayStart,
            $lte: dayEnd
          }
        });

        const totalPosts = posts.length;
        const successfulPosts = posts.filter(p => p.status === 'posted').length;
        const failedPosts = posts.filter(p => p.status === 'failed').length;
        
        const mockEngagement = {
          totalViews: Math.floor(Math.random() * 800) + 200,
          totalLikes: Math.floor(Math.random() * 40) + 10,
          totalComments: Math.floor(Math.random() * 15) + 2,
          totalShares: Math.floor(Math.random() * 8) + 1,
          avgEngagementRate: Math.random() * 0.08 + 0.03
        };

        reports.push({
          date: dateStr!,
          userId,
          userName: user.username || user.name || 'Unknown User',
          userEmail: user.email,
          summary: {
            totalPosts,
            successfulPosts,
            failedPosts,
            successRate: totalPosts > 0 ? (successfulPosts / totalPosts) * 100 : 0
          },
          platforms: {
            instagram: {
              posts: posts.filter(p => p.platform === 'instagram').length,
              successful: posts.filter(p => p.platform === 'instagram' && p.status === 'posted').length,
              failed: posts.filter(p => p.platform === 'instagram' && p.status === 'failed').length,
              views: Math.floor(mockEngagement.totalViews * 0.4),
              engagement: Math.floor(mockEngagement.totalLikes * 0.4)
            },
            tiktok: {
              posts: posts.filter(p => p.platform === 'tiktok').length,
              successful: posts.filter(p => p.platform === 'tiktok' && p.status === 'posted').length,
              failed: posts.filter(p => p.platform === 'tiktok' && p.status === 'failed').length,
              views: Math.floor(mockEngagement.totalViews * 0.4),
              engagement: Math.floor(mockEngagement.totalLikes * 0.4)
            },
            youtube: {
              posts: posts.filter(p => p.platform === 'youtube').length,
              successful: posts.filter(p => p.platform === 'youtube' && p.status === 'posted').length,
              failed: posts.filter(p => p.platform === 'youtube' && p.status === 'failed').length,
              views: Math.floor(mockEngagement.totalViews * 0.2),
              engagement: Math.floor(mockEngagement.totalLikes * 0.2)
            }
          },
          engagement: mockEngagement,
          topPerformingPosts: posts.slice(0, 2).map(post => ({
            id: String(post._id),
            platform: post.platform,
            content: post.content.substring(0, 100) + '...',
            views: Math.floor(Math.random() * 400) + 50,
            likes: Math.floor(Math.random() * 20) + 5,
            comments: Math.floor(Math.random() * 8) + 1,
            shares: Math.floor(Math.random() * 4) + 1,
            engagementRate: Math.random() * 0.08 + 0.03,
            postedAt: post.postedTime || post.scheduledTime
          })),
          errors: [],
          recommendations: []
        });
      }

      logger.info(`Retrieved ${reports.length} historical reports for user ${userId}`);
      return reports.reverse(); // Return in chronological order

    } catch (error) {
      logger.error(`Error getting historical reports for user ${userId}:`, error);
      throw error;
    }
  }

  // Start report scheduler (simplified implementation)
  startScheduler(): void {
    logger.info('Daily report scheduler started (simplified implementation)');
    // In a real implementation, this would set up a cron job or scheduler
    // For now, we just log that it would be started
  }

  // Check and notify about failures
  async checkAndNotifyFailures(): Promise<void> {
    try {
      await connectToDatabase();
      
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      // Find failed posts from yesterday
      const failedPosts = await Post.find({
        status: 'failed',
        createdAt: {
          $gte: yesterday,
          $lt: today
        }
      }).populate('userId', 'email username');

      if (failedPosts.length > 0) {
        logger.warn(`Found ${failedPosts.length} failed posts from yesterday`);
        
        // In a real implementation, this would send notifications
        // For now, we just log the failures
        for (const post of failedPosts) {
          logger.warn(`Failed post: ${post._id} - Platform: ${post.platform} - User: ${(post.userId as any).username}`);
        }
      }

      logger.info('Failure check completed');

    } catch (error) {
      logger.error('Error checking for failures:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dailyReportService = new DailyReportService();
export default dailyReportService; 