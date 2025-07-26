import { SmartRepostService } from './smartRepost';
import { VideoQueue } from './videoQueue';

export class RepostMonitor {
  private static instance: RepostMonitor;
  private isMonitoring: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private smartRepostService: SmartRepostService;

  private constructor() {
    this.smartRepostService = new SmartRepostService();
  }

  public static getInstance(): RepostMonitor {
    if (!RepostMonitor.instance) {
      RepostMonitor.instance = new RepostMonitor();
    }
    return RepostMonitor.instance;
  }

  /**
   * Start monitoring for repost triggers
   */
  public startMonitoring(intervalMinutes: number = 60): void {
    if (this.isMonitoring) {
      console.log('Repost monitor already running');
      return;
    }

    console.log(`🔄 Starting repost monitor - checking every ${intervalMinutes} minutes`);
    this.isMonitoring = true;

    // Check immediately on start
    this.checkForRepostTrigger();

    // Set up interval checking
    this.checkInterval = setInterval(() => {
      this.checkForRepostTrigger();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log('Repost monitor not running');
      return;
    }

    console.log('🛑 Stopping repost monitor');
    this.isMonitoring = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check if repost should be triggered and execute if needed
   */
  private async checkForRepostTrigger(): Promise<void> {
    try {
      console.log('🔍 Checking repost trigger conditions...');

      const shouldTrigger = await this.smartRepostService.shouldTriggerRepost();

      if (shouldTrigger) {
        console.log('✅ Repost conditions met - triggering smart repost process');
        
        const result = await this.smartRepostService.performSmartRepost();
        
        if (result.triggered) {
          console.log(`🎯 Smart repost completed: ${result.repostsScheduled} reposts scheduled from ${result.candidatesFound} candidates`);
          
          // Optional: Update last repost trigger time in settings or database
          await this.updateLastRepostTrigger();
        } else {
          console.log('⏸️ Repost trigger conditions not fully met');
        }
      } else {
        console.log('⌛ Repost threshold not reached yet');
      }
    } catch (error) {
      console.error('❌ Error during repost trigger check:', error);
    }
  }

  /**
   * Update last repost trigger timestamp
   */
  private async updateLastRepostTrigger(): Promise<void> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const settingsPath = path.join(process.cwd(), 'backend', 'settings.json');

      let settings = {};
      try {
        const settingsData = await fs.readFile(settingsPath, 'utf8');
        settings = JSON.parse(settingsData);
      } catch (error) {
        // File doesn't exist or can't be read, start with empty settings
      }

      // Update last repost trigger time
      const updatedSettings = {
        ...settings,
        lastRepostTrigger: new Date().toISOString()
      };

      await fs.writeFile(settingsPath, JSON.stringify(updatedSettings, null, 2));
      console.log('📝 Updated last repost trigger timestamp');
    } catch (error) {
      console.warn('⚠️ Could not update last repost trigger timestamp:', error);
    }
  }

  /**
   * Manually trigger repost check (for testing or manual execution)
   */
  public async manualTriggerCheck(): Promise<{
    triggered: boolean;
    candidatesFound: number;
    repostsScheduled: number;
  }> {
    try {
      console.log('🔧 Manual repost trigger check initiated');
      
      const result = await this.smartRepostService.performSmartRepost();
      
      if (result.triggered) {
        await this.updateLastRepostTrigger();
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error in manual repost trigger:', error);
      throw error;
    }
  }

  /**
   * Get monitoring status
   */
  public getStatus(): {
    isMonitoring: boolean;
    intervalActive: boolean;
  } {
    return {
      isMonitoring: this.isMonitoring,
      intervalActive: this.checkInterval !== null
    };
  }

  /**
   * Hook to be called when a new video is uploaded
   * This allows immediate checking without waiting for the interval
   */
  public async onVideoUploaded(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    try {
      console.log('📹 New video uploaded - checking repost conditions');
      
      // Add small delay to ensure database is updated
      setTimeout(() => {
        this.checkForRepostTrigger();
      }, 5000);
    } catch (error) {
      console.error('Error in upload hook:', error);
    }
  }
}

// Export singleton instance for easy access
export const repostMonitor = RepostMonitor.getInstance(); 