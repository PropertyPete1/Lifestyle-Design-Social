import SettingsModel from '../models/SettingsModel';

/**
 * Calculate optimal schedule time for posting
 */
export const schedulePost = async (platform: 'instagram' | 'youtube'): Promise<Date> => {
  try {
    const settings = await SettingsModel.findOne();
    
    if (!settings) {
      throw new Error('Settings not found');
    }

    const [hours, minutes] = (settings.postTime || '14:00').split(':').map(Number);
    const timezone = settings.timezone || 'America/Chicago'; // Default to Austin, Texas [[memory:4810294]]
    
    // Get current time in user's timezone
    const now = new Date();
    const userNow = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
    
    // Create scheduled time in user's timezone
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    
    // Convert to user's timezone for comparison
    const scheduledUser = new Date(scheduled.toLocaleString("en-US", {timeZone: timezone}));
    
    // If time has passed today in user's timezone, schedule for tomorrow
    if (scheduledUser <= userNow) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    
    // Add platform-specific delay
    if (platform === 'youtube') {
      // Schedule YouTube 30 minutes after Instagram
      scheduled.setMinutes(scheduled.getMinutes() + 30);
    }
    
    console.log(`🕐 Scheduling ${platform} for ${hours}:${minutes.toString().padStart(2, '0')} ${timezone}`);
    console.log(`📅 Scheduled UTC time: ${scheduled.toISOString()}`);
    console.log(`📍 Local time: ${scheduled.toLocaleString("en-US", {timeZone: timezone})}`);
    
    return scheduled;
    
  } catch (error) {
    console.error(`❌ Failed to calculate schedule time for ${platform}:`, error);
    
    // Fallback to immediate posting
    return new Date();
  }
};

/**
 * Calculate next available posting slot with delay
 */
export const getNextAvailableSlot = async (baseTime: Date, platform: 'instagram' | 'youtube'): Promise<Date> => {
  try {
    const settings = await SettingsModel.findOne();
    const delayHours = settings?.repostDelay || 1; // Default 1 hour between posts
    
    const nextSlot = new Date(baseTime);
    nextSlot.setHours(nextSlot.getHours() + delayHours);
    
    console.log(`⏰ Next ${platform} slot: ${nextSlot.toLocaleString("en-US", {timeZone: settings?.timezone || 'America/Chicago'})}`);
    
    return nextSlot;
    
  } catch (error) {
    console.error(`❌ Failed to calculate next slot for ${platform}:`, error);
    
    // Fallback: add 1 hour
    const fallback = new Date(baseTime);
    fallback.setHours(fallback.getHours() + 1);
    return fallback;
  }
};