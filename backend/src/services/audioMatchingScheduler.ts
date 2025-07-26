import * as cron from 'node-cron';
import { AudioMatchingService } from './audioMatchingService';

export class AudioMatchingScheduler {
  private audioMatchingService: AudioMatchingService;
  private matchingJob: cron.ScheduledTask | null = null;

  constructor() {
    this.audioMatchingService = new AudioMatchingService();
  }

  /**
   * Start the scheduled audio matching job
   * Runs every 2 hours to match videos with fresh trending audio
   */
  start(): void {
    if (this.matchingJob) {
      console.log('🎵 Audio matching scheduler already running');
      return;
    }

    // Schedule job to run every 2 hours
    this.matchingJob = cron.schedule('0 */2 * * *', async () => {
      console.log('🎵 Starting scheduled audio matching...');
      try {
        const matches = await this.audioMatchingService.matchAllPendingVideos();
        console.log(`✅ Scheduled audio matching completed: ${matches.length} videos matched`);
      } catch (error) {
        console.error('❌ Error in scheduled audio matching:', error);
      }
    });

    this.matchingJob.start();
    console.log('🎵 Audio matching scheduler started - running every 2 hours');
  }

  /**
   * Stop the scheduled audio matching job
   */
  stop(): void {
    if (this.matchingJob) {
      this.matchingJob.stop();
      this.matchingJob = null;
      console.log('🎵 Audio matching scheduler stopped');
    }
  }

  /**
   * Run audio matching immediately (manual trigger)
   */
  async runNow(): Promise<void> {
    console.log('🎵 Running audio matching manually...');
    try {
      const matches = await this.audioMatchingService.matchAllPendingVideos();
      console.log(`✅ Manual audio matching completed: ${matches.length} videos matched`);
    } catch (error) {
      console.error('❌ Error in manual audio matching:', error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { running: boolean; status?: string } {
    if (!this.matchingJob) {
      return { running: false };
    }

    const status = this.matchingJob.getStatus();
    return {
      running: status === 'scheduled',
      status: typeof status === 'string' ? status : 'unknown'
    };
  }
}

// Export singleton instance
export const audioMatchingScheduler = new AudioMatchingScheduler(); 