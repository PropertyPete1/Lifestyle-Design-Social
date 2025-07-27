import * as youtubeAnalyzer from '../youtube/analyzePeakHours';
import * as instagramAnalyzer from '../instagram/analyzePeakHours';
import PeakEngagementTimes from '../../models/PeakEngagementTimes';
import * as cron from 'node-cron';

export class PeakHoursScheduler {
  private isRunning: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;
  private schedulerActive: boolean = false;

  constructor() {
    this.setupCronJob();
  }

  private setupCronJob(): void {
    // Run analysis daily at 2 AM
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      if (!this.isRunning) {
        await this.runFullAnalysis();
      }
    });
    this.cronJob.stop(); // Start stopped, will be started manually
  }

  public startScheduler(): void {
    if (this.cronJob) {
      this.cronJob.start();
      this.schedulerActive = true;
      console.log('🕒 Peak Hours Scheduler started - will run daily at 2 AM');
    }
  }

  public stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.schedulerActive = false;
      console.log('🛑 Peak Hours Scheduler stopped');
    }
  }

  public async runFullAnalysis(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Peak hours analysis already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting full peak hours analysis...');

    try {
      // Run both platform analyses in parallel
      const [youtubeResult, instagramResult] = await Promise.allSettled([
        youtubeAnalyzer.analyzePeakHours(),
        instagramAnalyzer.analyzePeakHours()
      ]);

      // Log results
      if (youtubeResult.status === 'fulfilled') {
        console.log('✅ YouTube peak hours analysis completed');
      } else {
        console.error('❌ YouTube peak hours analysis failed:', youtubeResult.reason);
      }

      if (instagramResult.status === 'fulfilled') {
        console.log('✅ Instagram peak hours analysis completed');
      } else {
        console.error('❌ Instagram peak hours analysis failed:', instagramResult.reason);
      }

      console.log('🎉 Full peak hours analysis completed');

    } catch (error) {
      console.error('❌ Error in peak hours analysis:', error);
    } finally {
      this.isRunning = false;
    }
  }

  public async runYouTubeAnalysis(): Promise<void> {
    try {
      console.log('🎥 Running YouTube peak hours analysis...');
      await youtubeAnalyzer.analyzePeakHours();
      console.log('✅ YouTube analysis completed');
    } catch (error) {
      console.error('❌ YouTube analysis failed:', error);
      throw error;
    }
  }

  public async runInstagramAnalysis(): Promise<void> {
    try {
      console.log('📸 Running Instagram peak hours analysis...');
      await instagramAnalyzer.analyzePeakHours();
      console.log('✅ Instagram analysis completed');
    } catch (error) {
      console.error('❌ Instagram analysis failed:', error);
      throw error;
    }
  }

  public async getOptimalTimes(platform?: 'youtube' | 'instagram', limit: number = 10): Promise<any> {
    try {
      if (platform) {
        if (platform === 'youtube') {
          return await youtubeAnalyzer.getOptimalPostingTimes(platform, limit);
        } else {
          return await instagramAnalyzer.getOptimalPostingTimes(platform, limit);
        }
      }

      // Get optimal times for both platforms
      const [youtubeTimes, instagramTimes] = await Promise.all([
        youtubeAnalyzer.getOptimalPostingTimes('youtube', limit),
        instagramAnalyzer.getOptimalPostingTimes('instagram', limit)
      ]);

      return {
        youtube: youtubeTimes,
        instagram: instagramTimes,
        combined: this.combinePlatformTimes(youtubeTimes, instagramTimes, limit)
      };

    } catch (error) {
      console.error('❌ Error getting optimal times:', error);
      return platform ? [] : { youtube: [], instagram: [], combined: [] };
    }
  }

  private combinePlatformTimes(youtubeTimes: any[], instagramTimes: any[], limit: number): any[] {
    // Combine and sort by average score across platforms
    const allTimes = new Map<string, any>();

    // Add YouTube times
    youtubeTimes.forEach(time => {
      const key = `${time.dayOfWeek}-${time.hour}`;
      allTimes.set(key, {
        dayOfWeek: time.dayOfWeek,
        hour: time.hour,
        timeSlot: time.timeSlot,
        youtubeScore: time.score,
        instagramScore: 0,
        combinedScore: time.score / 2,
        platforms: ['youtube']
      });
    });

    // Add Instagram times
    instagramTimes.forEach(time => {
      const key = `${time.dayOfWeek}-${time.hour}`;
      if (allTimes.has(key)) {
        const existing = allTimes.get(key)!;
        existing.instagramScore = time.score;
        existing.combinedScore = (existing.youtubeScore + time.score) / 2;
        existing.platforms.push('instagram');
      } else {
        allTimes.set(key, {
          dayOfWeek: time.dayOfWeek,
          hour: time.hour,
          timeSlot: time.timeSlot,
          youtubeScore: 0,
          instagramScore: time.score,
          combinedScore: time.score / 2,
          platforms: ['instagram']
        });
      }
    });

    return Array.from(allTimes.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, limit);
  }

  public async getAnalysisStatus(): Promise<any> {
    try {
      const [youtubeCount, instagramCount] = await Promise.all([
        PeakEngagementTimes.countDocuments({ platform: 'youtube' }),
        PeakEngagementTimes.countDocuments({ platform: 'instagram' })
      ]);

      const lastUpdate = await PeakEngagementTimes
        .findOne({})
        .sort({ lastUpdated: -1 })
        .select('lastUpdated');

      return {
        isRunning: this.isRunning,
        schedulerActive: this.schedulerActive,
        dataPoints: {
          youtube: youtubeCount,
          instagram: instagramCount,
          total: youtubeCount + instagramCount
        },
        lastUpdate: lastUpdate?.lastUpdated || null,
        nextScheduledRun: '2:00 AM daily'
      };

    } catch (error) {
      console.error('❌ Error getting analysis status:', error);
      return {
        isRunning: this.isRunning,
        schedulerActive: false,
        dataPoints: { youtube: 0, instagram: 0, total: 0 },
        lastUpdate: null,
        nextScheduledRun: '2:00 AM daily',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public isAnalysisRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const peakHoursScheduler = new PeakHoursScheduler(); 