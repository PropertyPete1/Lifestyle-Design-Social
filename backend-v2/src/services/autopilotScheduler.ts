import * as cron from 'node-cron';
import { autopilotService } from './autopilotService';
import SettingsModel from '../models/SettingsModel';

class AutopilotScheduler {
  private cronJob: any = null;
  private isRunning = false;

  /**
   * Start the autopilot scheduler (checks every 15 minutes)
   */
  start() {
    if (this.cronJob) {
      console.log('🔄 Autopilot scheduler already running');
      return;
    }

    // Run every 15 minutes
    this.cronJob = cron.schedule('*/15 * * * *', async () => {
      await this.checkAndRunAutopilot();
    });

    console.log('⏰ Autopilot scheduler started (runs every 15 minutes)');
    this.isRunning = true;
  }

  /**
   * Stop the autopilot scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
      this.isRunning = false;
      console.log('⏹️ Autopilot scheduler stopped');
    }
  }

  /**
   * Check if autopilot should run and execute if needed
   */
  private async checkAndRunAutopilot() {
    try {
      // Get current settings
      const settings = await SettingsModel.findOne();
      
      // Only run if autopilot is enabled
      if (!settings || !settings.autopilot) {
        return;
      }

      // Check if we should run based on schedule
      const shouldRun = await this.shouldRunNow(settings);
      
      if (shouldRun) {
        console.log('🚀 Running scheduled autopilot...');
        await autopilotService.runAutopilot();
      } else {
        // Only log occasionally to reduce noise
        const minute = new Date().getMinutes();
        if (minute % 30 === 0) { // Log every 30 minutes
          console.log('⏰ Autopilot scheduler active - next check in 15 minutes');
        }
      }
      
    } catch (error) {
      console.error('❌ Autopilot scheduler error:', error);
    }
  }

  /**
   * Determine if autopilot should run now based on settings
   */
  private async shouldRunNow(settings: any): Promise<boolean> {
    const now = new Date();
    const [hours, minutes] = (settings.postTime || '14:00').split(':').map(Number);
    
    // Check if we're within 15 minutes of the scheduled post time
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
    const fifteenMinutes = 15 * 60 * 1000;
    
    // Only run if we're close to the scheduled time
    return timeDiff <= fifteenMinutes;
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob ? 'Every 15 minutes' : null
    };
  }
}

export const autopilotScheduler = new AutopilotScheduler();