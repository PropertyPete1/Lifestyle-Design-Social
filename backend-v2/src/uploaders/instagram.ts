import FormData from 'form-data';
import SettingsModel from '../models/SettingsModel';

interface InstagramUploadOptions {
  videoPath: string;
  caption: string;
  audio?: string | null;
  scheduledTime?: Date;
}

/**
 * Upload video to Instagram using Facebook Graph API
 */
export const uploadToInstagram = async (options: InstagramUploadOptions): Promise<string> => {
  const { videoPath, caption, scheduledTime } = options;
  
  try {
    console.log(`📸 Starting Instagram upload: ${videoPath}`);
    
    const settings = await SettingsModel.findOne();
    if (!settings?.instagramToken || !settings?.instagramAccount) {
      throw new Error('Instagram credentials not configured in settings');
    }

    // Check if we should post now or schedule
    const shouldPostNow = !scheduledTime || scheduledTime <= new Date();
    
    if (shouldPostNow) {
      // Post immediately
      return await postToInstagramNow(videoPath, caption, settings);
    } else {
      // For scheduled posts, we'll store in queue and post later
      console.log(`📅 Instagram post scheduled for: ${scheduledTime.toISOString()}`);
      return 'scheduled';
    }
    
  } catch (error) {
    console.error('❌ Instagram upload failed:', error);
    throw error;
  }
};

/**
 * Post to Instagram immediately
 */
const postToInstagramNow = async (videoPath: string, caption: string, settings: any): Promise<string> => {
  try {
    // Step 1: Create Reels media container with direct file upload
    console.log(`📸 Creating Instagram Reels container...`);
    
    // Instagram requires a publicly accessible video_url for Reels
    // We'll serve the video temporarily via our backend
    const videoFileName = `temp_${Date.now()}.mp4`;
    const publicVideoUrl = `http://localhost:3002/temp/${videoFileName}`;
    
    // Copy video to temp public directory
    const fs = require('fs');
    const path = require('path');
    const tempDir = path.resolve(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Check if source video exists and has content
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Source video file does not exist: ${videoPath}`);
    }
    
    const stats = fs.statSync(videoPath);
    if (stats.size === 0) {
      throw new Error(`Source video file is empty (0 bytes): ${videoPath}`);
    }
    
    console.log(`🔍 Source video: ${videoPath} (${stats.size} bytes)`);
    
    const tempVideoPath = path.join(tempDir, videoFileName);
    
    try {
      fs.copyFileSync(videoPath, tempVideoPath);
      console.log(`📋 Copied video from: ${videoPath}`);
      console.log(`📋 Copied video to: ${tempVideoPath}`);
      
      // Verify the copy was successful
      if (fs.existsSync(tempVideoPath)) {
        const copiedStats = fs.statSync(tempVideoPath);
        console.log(`✅ Video copied successfully: ${tempVideoPath} (${copiedStats.size} bytes)`);
      } else {
        throw new Error(`File copy failed - destination file does not exist: ${tempVideoPath}`);
      }
    } catch (copyError) {
      console.error(`❌ File copy failed:`, copyError);
      throw new Error(`Failed to copy video to temp directory: ${copyError.message}`);
    }
    
    console.log(`📸 Video made accessible at: ${publicVideoUrl}`);
    
    const formData = new FormData();
    formData.append('media_type', 'REELS');
    formData.append('video_url', publicVideoUrl);
    formData.append('cover_url', publicVideoUrl); // Reel cover image
    formData.append('image_url', publicVideoUrl); // Still required by Instagram API for Reels
    formData.append('caption', caption);
    formData.append('share_to_feed', 'true');
    
    // Debug: Log what we're sending
    console.log(`🔍 FormData contents:
    - media_type: REELS
    - video_url: ${publicVideoUrl}
    - cover_url: ${publicVideoUrl}
    - image_url: ${publicVideoUrl}
    - caption: ${caption.substring(0, 50)}...
    - share_to_feed: true`);
    
    const mediaResponse = await fetch(`https://graph.facebook.com/v21.0/${settings.instagramAccount}/media?access_token=${settings.instagramToken}`, {
      method: 'POST',
      body: formData as any
    });

    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.json();
      throw new Error(`Container creation failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const mediaData = await mediaResponse.json();
    const mediaId = mediaData.id;
    console.log(`📸 Instagram media container created: ${mediaId}`);

    // Step 2: Publish the media
    const publishResponse = await fetch(`https://graph.facebook.com/v21.0/${settings.instagramAccount}/media_publish?access_token=${settings.instagramToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        creation_id: mediaId,
        access_token: settings.instagramToken
      })
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json();
      throw new Error(`Publish failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const publishData = await publishResponse.json();
    const publishedId = publishData.id;
    console.log(`✅ Instagram post published successfully: ${publishedId}`);

    // Clean up temporary file
    try {
      fs.unlinkSync(tempVideoPath);
      console.log(`🧹 Cleaned up temp file: ${tempVideoPath}`);
    } catch (error) {
      console.warn(`⚠️ Could not clean up temp file: ${error}`);
    }

    return publishedId;
    
  } catch (error) {
    console.error('❌ Instagram posting failed:', error);
    throw error;
  }
};