import { RepostQueue } from '../../models/RepostQueue';
import { InstagramArchive } from '../../models/InstagramContent';
import { analyzePeakHours } from './analyzePeakHours';
import * as fs from 'fs';
import * as path from 'path';
import * as cron from 'node-cron';

interface WeeklySchedule {
  [key: string]: {
    instagram: string;
    youtube: string;
  };
}

interface PeakHours {
  instagram: { hour: number; engagement: number }[];
  youtube: { hour: number; engagement: number }[];
}

export class Phase9DailyScheduler {
  private settingsPath: string;
  private schedulingJob?: any;

  constructor() {
    this.settingsPath = path.join(__dirname, '../../../settings.json');
  }

  /**
   * Start the daily scheduling system
   */
  async startDailyScheduling(): Promise<void> {
    try {
      console.log('📅 Phase 9: Starting daily scheduling system...');

      const settings = this.loadSettings();
      const dailySettings = settings.phase9Settings?.dailyScheduling;

      if (!dailySettings?.enabled) {
        console.log('📅 Daily scheduling is disabled');
        return;
      }

      // Schedule daily preparation job (runs at 2 AM every day)
      this.schedulingJob = cron.schedule(dailySettings.scheduleTime || '0 2 * * *', async () => {
        await this.prepareDailySchedule();
      });

      // Run initial schedule preparation for today and rest of week
      await this.scheduleRestOfWeek();

      console.log('✅ Daily scheduling system started');

    } catch (error) {
      console.error('❌ Failed to start daily scheduling:', error);
      throw error;
    }
  }

  /**
   * Stop the daily scheduling system
   */
  stopDailyScheduling(): void {
    if (this.schedulingJob) {
      this.schedulingJob.stop();
      this.schedulingJob = undefined;
      console.log('✅ Daily scheduling system stopped');
    }
  }

  /**
   * Schedule posts for the rest of the week starting from today
   */
  async scheduleRestOfWeek(): Promise<{
    success: boolean;
    scheduledPosts: number;
    weekSchedule: { [key: string]: { instagram: number; youtube: number } };
  }> {
    try {
      console.log('📅 Scheduling posts for the rest of the week...');

      const settings = this.loadSettings();
      const phase9Settings = settings.phase9Settings || {};
      const weeklySchedule = phase9Settings.dailyScheduling?.weeklySchedule || this.getDefaultWeeklySchedule();
      
      // Use maxRepostsPerPlatform from phase9Settings for precise control
      const maxRepostsPerDay = settings.maxRepostsPerDay || 8;
      const maxPostsPerPlatform = phase9Settings.maxRepostsPerPlatform || Math.floor(maxRepostsPerDay / 2); // 4 posts per platform (Instagram + YouTube)

      // Get peak hours for both platforms
      const peakHours = await this.getPeakHours();

      // Get top performers that haven't been posted recently
      const availableContent = await this.getAvailableContent();

      let totalScheduled = 0;
      const weekSchedule: { [key: string]: { instagram: number; youtube: number } } = {};

      // Schedule for each day of the week starting from today
      const today = new Date();
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        
        const dayName = daysOfWeek[targetDate.getDay()];
        const daySchedule = weeklySchedule[dayName];
        
        if (!daySchedule) continue;

        const scheduledForDay = await this.scheduleDayPosts(
          targetDate,
          daySchedule,
          availableContent,
          peakHours,
          maxPostsPerPlatform
        );

        weekSchedule[dayName] = scheduledForDay;
        totalScheduled += scheduledForDay.instagram + scheduledForDay.youtube;

        console.log(`📅 ${dayName.toUpperCase()}: Instagram at ${daySchedule.instagram}, YouTube at ${daySchedule.youtube}`);
        console.log(`   📊 Scheduled: ${scheduledForDay.instagram} Instagram, ${scheduledForDay.youtube} YouTube posts`);
      }

      console.log(`✅ Week scheduling complete: ${totalScheduled} posts scheduled across both platforms`);

      return {
        success: true,
        scheduledPosts: totalScheduled,
        weekSchedule
      };

    } catch (error) {
      console.error('❌ Failed to schedule rest of week:', error);
      return {
        success: false,
        scheduledPosts: 0,
        weekSchedule: {}
      };
    }
  }

  /**
   * Schedule posts for a specific day
   */
  private async scheduleDayPosts(
    targetDate: Date,
    daySchedule: { instagram: string; youtube: string },
    availableContent: any[],
    peakHours: PeakHours,
    maxPostsPerPlatform: number
  ): Promise<{ instagram: number; youtube: number }> {
    const scheduled = { instagram: 0, youtube: 0 };

    try {
      // Skip if date is in the past
      if (targetDate < new Date()) {
        return scheduled;
      }

      // Schedule Instagram posts
      const instagramTime = this.parseTimeString(daySchedule.instagram);
      const instagramDate = new Date(targetDate);
      instagramDate.setHours(instagramTime.hour, instagramTime.minute, 0, 0);

      // Optimize timing based on peak hours
      const optimizedInstagramTime = this.optimizePostTime(instagramDate, peakHours.instagram);

      const instagramContent = availableContent
        .filter(content => !content.scheduledForInstagram)
        .slice(0, maxPostsPerPlatform);

      for (let i = 0; i < instagramContent.length; i++) {
        const content = instagramContent[i];
        const postTime = new Date(optimizedInstagramTime);
        postTime.setMinutes(postTime.getMinutes() + (i * 30)); // Stagger posts by 30 minutes

        await this.createScheduledPost(content, 'instagram', postTime, i + 1);
        content.scheduledForInstagram = true;
        scheduled.instagram++;
      }

      // Schedule YouTube posts
      const youtubeTime = this.parseTimeString(daySchedule.youtube);
      const youtubeDate = new Date(targetDate);
      youtubeDate.setHours(youtubeTime.hour, youtubeTime.minute, 0, 0);

      // Optimize timing based on peak hours
      const optimizedYouTubeTime = this.optimizePostTime(youtubeDate, peakHours.youtube);

      // Use the SAME content for YouTube as Instagram (same videos on both platforms)
      const youtubeContent = instagramContent;

      for (let i = 0; i < youtubeContent.length; i++) {
        const content = youtubeContent[i];
        const postTime = new Date(optimizedYouTubeTime);
        postTime.setMinutes(postTime.getMinutes() + (i * 45)); // Stagger posts by 45 minutes

        await this.createScheduledPost(content, 'youtube', postTime, i + 1);
        content.scheduledForYouTube = true;
        scheduled.youtube++;
      }

    } catch (error) {
      console.error(`❌ Failed to schedule posts for ${targetDate.toDateString()}:`, error);
    }

    return scheduled;
  }

  /**
   * Create a scheduled post entry in the repost queue
   */
  private async createScheduledPost(
    content: any,
    platform: 'instagram' | 'youtube',
    scheduledTime: Date,
    priority: number
  ): Promise<void> {
    try {
      // Check if already scheduled (any status to prevent any duplicates)
      const existing = await RepostQueue.findOne({
        sourceMediaId: content.videoId,
        targetPlatform: platform
      });

      if (existing) {
        console.log(`⏭️ Post ${content.videoId} already scheduled for ${platform} (status: ${existing.status})`);
        return;
      }

      const originalContent = {
        caption: content.caption,
        hashtags: content.hashtags,
        performanceScore: content.performanceScore,
        viewCount: content.viewCount,
        likeCount: content.likeCount,
        commentCount: content.commentCount,
        media_url: content.media_url,
        permalink: content.permalink,
        audioId: content.audioId
      };

      await RepostQueue.create({
        sourceMediaId: content.videoId,
        targetPlatform: platform,
        platform: platform, // Also set platform field for backward compatibility
        priority,
        scheduledFor: scheduledTime,
        originalContent,
        status: 'queued'
      });

      console.log(`📅 Scheduled ${platform} post: ${content.videoId} for ${scheduledTime.toLocaleString()}`);

    } catch (error) {
      console.error(`❌ Failed to create scheduled post for ${content.videoId}:`, error);
    }
  }

  /**
   * Get available content for scheduling
   */
  private async getAvailableContent(): Promise<any[]> {
    try {
      // Get top performers that haven't been reposted recently (use settings minDaysBetweenPosts)
      const settings = this.loadSettings();
      const minDaysBetween = settings.minDaysBetweenPosts || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - minDaysBetween);

      const availableContent = await InstagramArchive.find({
        $and: [
          {
            $or: [
              { mediaType: 'REEL' },
              { mediaType: 'VIDEO' }
            ]
          },
          { performanceScore: { $gt: 500 } }, // Lower threshold to get more content
          {
            $or: [
              { lastRepostDate: { $exists: false } },
              { lastRepostDate: { $lt: cutoffDate } }
            ]
          }
        ]
      })
      .sort({ performanceScore: -1 })
      .limit(200); // Get more content to ensure we have enough for the week

      console.log(`📊 Found ${availableContent.length} pieces of content available for scheduling`);
      return availableContent;

    } catch (error) {
      console.error('❌ Failed to get available content:', error);
      return [];
    }
  }

  /**
   * Get peak hours for both platforms
   */
  private async getPeakHours(): Promise<PeakHours> {
    try {
      // Get real audience engagement data from database
      const { peakHoursScheduler } = require('../../lib/peakHours/scheduler');
      
      const instagramOptimal = await peakHoursScheduler.getOptimalTimes('instagram', 5);
      const youtubeOptimal = await peakHoursScheduler.getOptimalTimes('youtube', 5);
      
      // Convert optimal times to the expected format
      const instagramPeaks = instagramOptimal.map((time: any) => ({
        hour: time.hour,
        engagement: time.score
      }));
      
      const youtubePeaks = youtubeOptimal.map((time: any) => ({
        hour: time.hour,
        engagement: time.score
      }));
      
      console.log(`📊 Using real audience data: Instagram peaks at ${instagramPeaks.map(p => `${p.hour}:00`).join(', ')}`);
      console.log(`📊 Using real audience data: YouTube peaks at ${youtubePeaks.map(p => `${p.hour}:00`).join(', ')}`);
      
      return {
        instagram: instagramPeaks.length > 0 ? instagramPeaks : [
          { hour: 14, engagement: 100 }, // Default fallback: Sunday 2PM (from real data)
          { hour: 22, engagement: 95 },  // Monday 10PM
          { hour: 13, engagement: 90 }   // Thursday 1PM
        ],
        youtube: youtubePeaks.length > 0 ? youtubePeaks : [
          { hour: 18, engagement: 100 }, // Default fallback: Friday 6PM (from real data)
          { hour: 12, engagement: 95 },  // Monday/Friday 12PM
          { hour: 17, engagement: 90 }   // Standard evening time
        ]
      };

    } catch (error) {
      console.error('❌ Failed to get real peak hours, using smart defaults:', error);
      return {
        instagram: [
          { hour: 14, engagement: 100 }, // Sunday 2PM (from your real data)
          { hour: 22, engagement: 95 },  // Monday 10PM (from your real data)
          { hour: 13, engagement: 90 }   // Thursday 1PM (from your real data)
        ],
        youtube: [
          { hour: 18, engagement: 100 }, // Friday 6PM (from your real data)
          { hour: 12, engagement: 95 },  // Monday 12PM (from your real data)
          { hour: 17, engagement: 90 }   // Standard evening time
        ]
      };
    }
  }

  /**
   * Optimize post time based on peak hours
   */
  private optimizePostTime(
    baseTime: Date,
    peakHours: { hour: number; engagement: number }[]
  ): Date {
    const optimizedTime = new Date(baseTime);
    
    // Find the closest peak hour
    const baseHour = baseTime.getHours();
    let closestPeak = peakHours[0];
    let minDistance = Math.abs(baseHour - closestPeak.hour);

    for (const peak of peakHours) {
      const distance = Math.abs(baseHour - peak.hour);
      if (distance < minDistance) {
        minDistance = distance;
        closestPeak = peak;
      }
    }

    // Adjust time to be closer to peak hour (but not exactly)
    const targetHour = closestPeak.hour;
    const adjustment = Math.round((targetHour - baseHour) * 0.5); // Move 50% towards peak
    
    optimizedTime.setHours(baseHour + adjustment);
    
    return optimizedTime;
  }

  /**
   * Parse time string (e.g., "10:30") to hour and minute
   */
  private parseTimeString(timeStr: string): { hour: number; minute: number } {
    const [hourStr, minuteStr] = timeStr.split(':');
    return {
      hour: parseInt(hourStr, 10),
      minute: parseInt(minuteStr, 10) || 0
    };
  }

  /**
   * Get default weekly schedule
   */
  private getDefaultWeeklySchedule(): WeeklySchedule {
    return {
      monday: { instagram: "10:00", youtube: "14:00" },
      tuesday: { instagram: "09:30", youtube: "15:30" },
      wednesday: { instagram: "11:00", youtube: "16:00" },
      thursday: { instagram: "10:30", youtube: "14:30" },
      friday: { instagram: "09:00", youtube: "17:00" },
      saturday: { instagram: "12:00", youtube: "18:00" },
      sunday: { instagram: "13:00", youtube: "19:00" }
    };
  }

  /**
   * Prepare daily schedule (runs every morning)
   */
  private async prepareDailySchedule(): Promise<void> {
    try {
      console.log('🌅 Preparing daily schedule...');

      const settings = this.loadSettings();
      const phase9Settings = settings.phase9Settings || {};

      if (!phase9Settings.dailyScheduling?.prepareForTomorrow) {
        return;
      }

      // Schedule posts for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = daysOfWeek[tomorrow.getDay()];
      const weeklySchedule = phase9Settings.dailyScheduling.weeklySchedule || this.getDefaultWeeklySchedule();
      const daySchedule = weeklySchedule[dayName];

      if (daySchedule) {
        const peakHours = await this.getPeakHours();
        const availableContent = await this.getAvailableContent();
        const maxPostsPerPlatform = phase9Settings.maxPostsPerPlatform || 4;

        await this.scheduleDayPosts(tomorrow, daySchedule, availableContent, peakHours, maxPostsPerPlatform);
        console.log(`✅ Prepared schedule for ${dayName} (${tomorrow.toDateString()})`);
      }

    } catch (error) {
      console.error('❌ Failed to prepare daily schedule:', error);
    }
  }

  /**
   * Get scheduling statistics
   */
  async getSchedulingStats(): Promise<{
    totalScheduled: number;
    instagramScheduled: number;
    youtubeScheduled: number;
    nextPost?: Date;
    upcomingWeek: { [key: string]: number };
  }> {
    try {
      const totalScheduled = await RepostQueue.countDocuments({ status: 'queued' });
      const instagramScheduled = await RepostQueue.countDocuments({ 
        targetPlatform: 'instagram', 
        status: 'queued' 
      });
      const youtubeScheduled = await RepostQueue.countDocuments({ 
        targetPlatform: 'youtube', 
        status: 'queued' 
      });

      const nextPost = await RepostQueue.findOne({ status: 'queued' })
        .sort({ scheduledFor: 1 })
        .select('scheduledFor');

      // Get upcoming week breakdown
      const weekStart = new Date();
      const weekEnd = new Date();
      weekEnd.setDate(weekStart.getDate() + 7);

      const upcomingPosts = await RepostQueue.find({
        status: 'queued',
        scheduledFor: { $gte: weekStart, $lte: weekEnd }
      }).sort({ scheduledFor: 1 });

      const upcomingWeek: { [key: string]: number } = {};
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      for (const post of upcomingPosts) {
        const dayName = daysOfWeek[post.scheduledFor.getDay()];
        upcomingWeek[dayName] = (upcomingWeek[dayName] || 0) + 1;
      }

      return {
        totalScheduled,
        instagramScheduled,
        youtubeScheduled,
        nextPost: nextPost?.scheduledFor,
        upcomingWeek
      };

    } catch (error) {
      console.error('❌ Error getting scheduling stats:', error);
      return {
        totalScheduled: 0,
        instagramScheduled: 0,
        youtubeScheduled: 0,
        upcomingWeek: {}
      };
    }
  }

  /**
   * Clean up old scheduled posts that are past due
   */
  async cleanupOldScheduledPosts(): Promise<number> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const result = await RepostQueue.deleteMany({
        status: 'queued',
        scheduledFor: { $lt: oneDayAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} old scheduled posts`);
      }

      return result.deletedCount;

    } catch (error) {
      console.error('❌ Failed to cleanup old scheduled posts:', error);
      return 0;
    }
  }

  /**
   * Load settings from file
   */
  private loadSettings(): any {
    try {
      const settingsData = fs.readFileSync(this.settingsPath, 'utf8');
      return JSON.parse(settingsData);
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      return {};
    }
  }
}