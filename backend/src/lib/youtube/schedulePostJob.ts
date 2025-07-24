import * as cron from 'node-cron';
import { publishVideo } from './publishVideo';
import { VideoQueue } from '../../services/videoQueue';

interface SchedulePostParams {
  videoId: string;
  scheduledTime: Date;
  title: string;
  description: string;
  tags: string[];
  audioTrackId?: string;
}

// Store active cron jobs
const scheduledJobs = new Map<string, any>();

export async function schedulePostJob({
  videoId,
  scheduledTime,
  title,
  description,
  tags,
  audioTrackId
}: SchedulePostParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate scheduled time is in the future
    if (scheduledTime <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    // Update video status to scheduled in MongoDB
    await VideoQueue.findByIdAndUpdate(videoId, {
      status: 'scheduled',
      scheduledTime: scheduledTime,
      selectedTitle: title,
      selectedDescription: description,
      selectedTags: tags,
      audioTrackId: audioTrackId
    });

    // Convert scheduled time to cron format
    const cronTime = convertDateToCron(scheduledTime);
    
    // Create cron job
    const job = cron.schedule(cronTime, async () => {
      console.log(`🕒 Executing scheduled post for video: ${videoId}`);
      
      try {
        const result = await publishVideo({
          videoId,
          title,
          description,
          tags,
          audioTrackId
        });

        if (result.success) {
          console.log(`✅ Scheduled video posted successfully: ${result.youtubeVideoId}`);
        } else {
          console.error(`❌ Failed to post scheduled video: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ Error in scheduled job for video ${videoId}:`, error);
        
        // Update video status to failed
        await VideoQueue.findByIdAndUpdate(videoId, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Scheduled job failed'
        });
      }

      // Remove job from memory after execution
      scheduledJobs.delete(videoId);
    }, {
      timezone: 'America/New_York' // Adjust to your timezone
    });

    // Store job reference
    scheduledJobs.set(videoId, job);
    
    // Start the job
    job.start();

    console.log(`🕒 Video scheduled for posting at ${scheduledTime.toISOString()}`);
    
    return { success: true };

  } catch (error) {
    console.error('❌ Failed to schedule video:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function cancelScheduledPost(videoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const job = scheduledJobs.get(videoId);
    if (job) {
      job.destroy();
      scheduledJobs.delete(videoId);
    }

    // Update video status back to pending
    await VideoQueue.findByIdAndUpdate(videoId, {
      status: 'pending',
      scheduledTime: undefined
    });

    console.log(`🚫 Cancelled scheduled post for video: ${videoId}`);
    
    return { success: true };

  } catch (error) {
    console.error('❌ Failed to cancel scheduled video:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to convert Date to cron format
function convertDateToCron(date: Date): string {
  const minutes = date.getMinutes();
  const hours = date.getHours();
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are 0-indexed
  const year = date.getFullYear();
  
  // Format: minute hour day month *
  return `${minutes} ${hours} ${day} ${month} *`;
}

// Function to initialize any existing scheduled jobs on server restart
export async function initializeScheduledJobs(): Promise<void> {
  try {
    const scheduledVideos = await VideoQueue.find({ 
      status: 'scheduled',
      scheduledTime: { $gt: new Date() } // Only future scheduled posts
    });

    for (const video of scheduledVideos) {
      if (video.scheduledTime && video.selectedTitle && video.selectedDescription) {
        await schedulePostJob({
          videoId: (video._id as any).toString(),
          scheduledTime: video.scheduledTime,
          title: video.selectedTitle,
          description: video.selectedDescription,
          tags: video.selectedTags || [],
          audioTrackId: video.audioTrackId
        });
      }
    }

    console.log(`🕒 Initialized ${scheduledVideos.length} scheduled jobs`);
  } catch (error) {
    console.error('❌ Failed to initialize scheduled jobs:', error);
  }
} 