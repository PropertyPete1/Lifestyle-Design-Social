import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import SettingsModel from '../models/SettingsModel';

interface YouTubeUploadOptions {
  videoPath: string;
  title: string;
  audio?: string | null;
  scheduledTime?: Date;
}

/**
 * Upload video to YouTube using YouTube Data API v3
 */
export const uploadToYouTube = async (options: YouTubeUploadOptions): Promise<string> => {
  const { videoPath, title, scheduledTime } = options;
  
  try {
    console.log(`▶️ Starting YouTube upload: ${videoPath}`);
    
    const settings = await SettingsModel.findOne();
    if (!settings?.youtubeRefresh || !settings?.youtubeClientId || !settings?.youtubeClientSecret) {
      throw new Error('YouTube credentials not configured in settings');
    }

    // Check if we should post now or schedule
    const shouldPostNow = !scheduledTime || scheduledTime <= new Date();
    
    if (shouldPostNow) {
      // Post immediately
      return await postToYouTubeNow(videoPath, title, settings);
    } else {
      // For scheduled posts, we'll store in queue and post later
      console.log(`📅 YouTube post scheduled for: ${scheduledTime.toISOString()}`);
      return 'scheduled';
    }
    
  } catch (error) {
    console.error('❌ YouTube upload failed:', error);
    throw error;
  }
};

/**
 * Post to YouTube immediately
 */
const postToYouTubeNow = async (videoPath: string, title: string, settings: any): Promise<string> => {
  try {
    // Step 1: Refresh access token if needed
    let accessToken = settings.youtubeToken;
    
    try {
      // Test current token
      await axios.get('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (tokenError) {
      // Token expired, refresh it
      console.log('🔄 Refreshing YouTube access token...');
      const refreshResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: settings.youtubeClientId,
        client_secret: settings.youtubeClientSecret,
        refresh_token: settings.youtubeRefresh,
        grant_type: 'refresh_token'
      });
      accessToken = refreshResponse.data.access_token;
      
      // Update settings with new token
      await SettingsModel.findOneAndUpdate({}, { youtubeToken: accessToken });
    }

    // Step 2: Create form data for multipart upload
    const form = new FormData();
    
    // Video metadata
    const metadata = {
      snippet: {
        title: title.substring(0, 100), // YouTube title limit
        description: `${title}\n\n#Shorts #Viral #Trending`,
        tags: ['shorts', 'reels', 'viral', 'trending'],
        categoryId: '22', // People & Blogs category
        defaultLanguage: 'en'
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
        embeddable: true
      }
    };

    // Use direct multipart upload (simpler and works reliably)
    console.log('📹 Starting YouTube multipart upload...');
    
    // Step 3: Use simple multipart upload with correct format
    const boundary = `----formdata-youtube-${Date.now()}`;
    const videoBuffer = fs.readFileSync(videoPath);
    
    // Build multipart body manually
    const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const videoPart = `--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`;
    const endBoundary = `\r\n--${boundary}--\r\n`;
    
    const body = Buffer.concat([
      Buffer.from(metadataPart),
      Buffer.from(videoPart),
      videoBuffer,
      Buffer.from(endBoundary)
    ]);

    const uploadResponse = await axios.post('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', body, {
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': body.length.toString()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const videoId = uploadResponse.data.id;
    console.log(`✅ YouTube video uploaded successfully: ${videoId}`);

    return videoId;
    
  } catch (error) {
    console.error('❌ YouTube posting failed:', error);
    throw error;
  }
};