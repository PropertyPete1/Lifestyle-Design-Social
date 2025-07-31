import axios from 'axios';
import { InstagramArchive } from '../models/InstagramContent';
import { RepostQueue } from '../models/RepostQueue';
import { AutopilotLog } from '../models/AutopilotLog';
import SettingsModel from '../models/SettingsModel';
import { trendingAudioService } from './trendingAudioService';
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';

interface AutopilotResult {
  runId: string;
  scraped: number;
  queued: number;
  posted: number;
  errors: string[];
}

class AutopilotService {
  private isRunning = false;

  /**
   * Main autopilot execution
   */
  async runAutopilot(): Promise<AutopilotResult> {
    if (this.isRunning) {
      throw new Error('Autopilot is already running');
    }

    this.isRunning = true;
    const runId = uuidv4();
    const startTime = new Date();
    
    try {
      console.log(`🚀 Starting autopilot run ${runId}`);
      
      // Get settings
      const settings = await SettingsModel.findOne();
      if (!settings || !settings.autopilot) {
        throw new Error('Autopilot is disabled in settings');
      }

      const result: AutopilotResult = {
        runId,
        scraped: 0,
        queued: 0,
        posted: 0,
        errors: []
      };

      // Step 1: Scrape Instagram content
      try {
        console.log('📸 Step 1: Scraping Instagram content...');
        const scrapeResult = await this.scrapeInstagramContent(settings);
        result.scraped = scrapeResult.newPosts;
        
        await this.logActivity(runId, 'scrape', 'completed', {
          postsProcessed: scrapeResult.totalProcessed,
          postsSuccessful: scrapeResult.newPosts
        });
      } catch (error) {
        const errorMsg = `Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        await this.logActivity(runId, 'scrape', 'failed', { error: errorMsg });
      }

      // Step 2: Process eligible content for reposting
      try {
        console.log('🔄 Step 2: Processing content for repost queue...');
        const queueResult = await this.processRepostQueue(settings);
        result.queued = queueResult.queued;
        
        await this.logActivity(runId, 'schedule', 'completed', {
          postsProcessed: queueResult.processed,
          postsSuccessful: queueResult.queued
        });
      } catch (error) {
        const errorMsg = `Queue processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        await this.logActivity(runId, 'schedule', 'failed', { error: errorMsg });
      }

      // Step 3: Execute scheduled reposts
      try {
        console.log('📤 Step 3: Executing scheduled reposts...');
        const postResult = await this.executeScheduledPosts(settings);
        result.posted = postResult.posted;
        
        await this.logActivity(runId, 'repost', 'completed', {
          postsProcessed: postResult.processed,
          postsSuccessful: postResult.posted,
          postsFailed: postResult.failed
        });
      } catch (error) {
        const errorMsg = `Reposting failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        await this.logActivity(runId, 'repost', 'failed', { error: errorMsg });
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      console.log(`✅ Autopilot run ${runId} completed in ${duration}ms`);
      console.log(`📊 Results: ${result.scraped} scraped, ${result.queued} queued, ${result.posted} posted`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Autopilot run ${runId} failed:`, error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Scrape Instagram content using Graph API
   */
  private async scrapeInstagramContent(settings: any): Promise<{ newPosts: number; totalProcessed: number }> {
    if (!settings.instagramToken || !settings.instagramAccount) {
      throw new Error('Instagram credentials not configured in app settings');
    }

    try {
      // Fetch latest 500 posts from Facebook Graph API (Instagram Business)
      const response = await axios.get(`https://graph.facebook.com/${settings.instagramAccount}/media`, {
        params: {
          fields: 'id,caption,media_type,media_url,timestamp,like_count,comments_count,insights.metric(impressions,reach,video_views)',
          limit: 500,
          access_token: settings.instagramToken
        }
      });

      const posts = response.data.data || [];
      let newPosts = 0;

      for (const post of posts) {
        // Only process videos
        if (post.media_type !== 'VIDEO') continue;

        // Check if already exists in database (deduplication)
        const exists = await InstagramArchive.findOne({ igPostId: post.id });
        if (exists) {
          console.log(`⏭️ Skipping existing post: ${post.id}`);
          continue;
        }

        // Extract video views - try video_views first, fallback to reach for reels
        const videoViewsMetric = post.insights?.data?.find((metric: any) => metric.name === 'video_views')?.values?.[0]?.value;
        const reachMetric = post.insights?.data?.find((metric: any) => metric.name === 'reach')?.values?.[0]?.value;
        const videoViews = videoViewsMetric || reachMetric || 0;
        
        // Parse hashtags from caption
        const hashtags = this.extractHashtags(post.caption || '');
        
        // Calculate performance score
        const performanceScore = this.calculatePerformanceScore(videoViews, post.like_count || 0, post.comments_count || 0);
        
        // Create Instagram archive entry
        await InstagramArchive.create({
          igPostId: post.id,
          caption: post.caption || '',
          hashtags,
          mediaUrl: post.media_url,
          mediaType: post.media_type,
          postTime: new Date(post.timestamp),
          viewCount: videoViews,
          likeCount: post.like_count || 0,
          commentCount: post.comments_count || 0,
          performanceScore,
          repostEligible: videoViews >= 10000,
          scraped: true
        });

        newPosts++;
      }

      return { newPosts, totalProcessed: posts.length };
      
    } catch (error: any) {
      console.error('❌ Instagram scraping failed:', error);
      
      // Provide helpful error messages
      if (error.response?.status === 400) {
        if (error.response.data?.error?.code === 190) {
          throw new Error('Instagram access token is expired or invalid. Please refresh your Instagram token in the app settings.');
        } else if (error.response.data?.error?.message?.includes('User does not exist')) {
          throw new Error('Instagram account ID is invalid. Please use your numeric Instagram account ID (not email) in the app settings.');
        }
      }
      
      throw new Error(`Instagram API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Process eligible content and add to repost queue
   */
  private async processRepostQueue(settings: any): Promise<{ queued: number; processed: number }> {
    // Get eligible content that hasn't been queued yet
    const eligibleContent = await InstagramArchive.find({
      mediaType: 'VIDEO',
      viewCount: { $gte: settings.minViews || 10000 },
      repostEligible: true
    }).sort({ performanceScore: -1 });

    let queued = 0;
    const maxPosts = settings.maxPosts || 3;

    for (const content of eligibleContent) {
      // Check if already in queue or has been posted before
      const inQueue = await RepostQueue.findOne({ originalPostId: content.igPostId });
      if (inQueue) {
        console.log(`⏭️ Skipping ${content.igPostId} - already in queue or posted`);
        continue;
      }

      // Additional check for completed reposts to prevent duplicates
      const alreadyPosted = await RepostQueue.findOne({ 
        originalPostId: content.igPostId, 
        status: 'completed' 
      });
      if (alreadyPosted) {
        console.log(`⏭️ Skipping ${content.igPostId} - already posted successfully`);
        continue;
      }

      // Respect daily post limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayQueued = await RepostQueue.countDocuments({
        createdAt: { $gte: today },
        status: { $in: ['queued', 'processing', 'completed'] }
      });

      if (todayQueued >= maxPosts) break;

      // Generate AI caption
      const newCaption = await this.generateAICaption(content.caption, settings);
      
      // Get trending audio
      const audioId = await trendingAudioService.getRandomTrendingAudio('instagram');
      
      // Schedule post time
      const scheduledFor = this.calculateScheduleTime(settings);

      // Add to queue for both platforms if enabled
      if (settings.postToInstagram) {
        await RepostQueue.create({
          originalPostId: content.igPostId,
          originalUrl: content.mediaUrl,
          targetPlatform: 'instagram',
          scheduledFor,
          newCaption,
          hashtags: await this.generateOptimizedHashtags(newCaption, 'instagram'),
          audioId,
          mediaUrl: content.mediaUrl
        });
        queued++;
      }

      if (settings.postToYouTube) {
        await RepostQueue.create({
          originalPostId: content.igPostId,
          originalUrl: content.mediaUrl,
          targetPlatform: 'youtube',
          scheduledFor: new Date(scheduledFor.getTime() + 30 * 60 * 1000), // 30 mins after IG
          newCaption,
          hashtags: await this.generateOptimizedHashtags(newCaption, 'youtube'),
          audioId: await trendingAudioService.getRandomTrendingAudio('youtube'),
          mediaUrl: content.mediaUrl
        });
        queued++;
      }

      // Only queue one video per run to respect limits
      break;
    }

    return { queued, processed: eligibleContent.length };
  }

  /**
   * Execute scheduled posts that are due
   */
  private async executeScheduledPosts(settings: any): Promise<{ posted: number; failed: number; processed: number }> {
    const now = new Date();
    const duePosts = await RepostQueue.find({
      status: 'queued',
      scheduledFor: { $lte: now }
    }).sort({ scheduledFor: 1 });

    let posted = 0;
    let failed = 0;

    for (const post of duePosts) {
      try {
        post.status = 'processing';
        await post.save();

        // Download and post to target platform
        if (post.targetPlatform === 'instagram') {
          await this.postToInstagram(post, settings);
        } else if (post.targetPlatform === 'youtube') {
          await this.postToYouTube(post, settings);
        }

        // Save to Dropbox if enabled
        if (settings.dropboxSave && settings.dropboxToken) {
          await this.saveToDropbox(post, settings);
        }

        post.status = 'completed';
        post.processedAt = new Date();
        await post.save();
        posted++;

      } catch (error) {
        console.error(`❌ Failed to post ${post._id}:`, error);
        post.status = 'failed';
        post.error = error instanceof Error ? error.message : 'Unknown error';
        await post.save();
        failed++;
      }
    }

    return { posted, failed, processed: duePosts.length };
  }

  /**
   * Get autopilot status and statistics
   */
  async getStatus() {
    const settings = await SettingsModel.findOne();
    const totalContent = await InstagramArchive.countDocuments();
    const eligibleContent = await InstagramArchive.countDocuments({ 
      repostEligible: true,
      viewCount: { $gte: 10000 }
    });
    
    const queueStats = await RepostQueue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const recentLogs = await AutopilotLog.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      isEnabled: settings?.autopilot || false,
      isRunning: this.isRunning,
      content: {
        total: totalContent,
        eligible: eligibleContent
      },
      queue: queueStats.reduce((acc: any, stat: any) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      recentActivity: recentLogs,
      settings: {
        maxPosts: settings?.maxPosts || 3,
        postTime: settings?.postTime || '14:00',
        repostDelay: settings?.repostDelay || 1
      }
    };
  }

  // Helper methods

  private extractHashtags(caption: string): string[] {
    const hashtags = caption.match(/#[a-zA-Z0-9_]+/g) || [];
    return hashtags.map(tag => tag.slice(1)); // Remove # symbol
  }

  private calculatePerformanceScore(views: number, likes: number, comments: number): number {
    return Math.round(views + (likes * 10) + (comments * 50));
  }

  private async generateAICaption(originalCaption: string, settings: any): Promise<string> {
    if (!settings.openaiApi) {
      return originalCaption.replace(/-/g, ''); // Just strip dashes if no OpenAI
    }

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Rewrite this Instagram caption to be more engaging while keeping the core message. Remove all dashes (-). Keep it under 150 characters and maintain any existing hashtags:\n\n${originalCaption}`
        }],
        max_tokens: 100,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${settings.openaiApi}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('❌ AI caption generation failed:', error);
      return originalCaption.replace(/-/g, ''); // Fallback to strip dashes
    }
  }

  private async generateOptimizedHashtags(caption: string, platform: 'instagram' | 'youtube'): Promise<string[]> {
    // For now, return a mix of trending hashtags
    // This could be enhanced with real trending data
    const instagramTags = ['mindset', 'motivation', 'lifestyle', 'success', 'entrepreneur', 'inspiration', 'goals', 'hustle', 'grind', 'manifest'];
    const youtubeTags = ['shorts', 'viral', 'trending', 'fyp', 'motivation', 'success', 'lifestyle', 'mindset', 'tips', 'hack'];
    
    const baseTags = platform === 'instagram' ? instagramTags : youtubeTags;
    
    // Extract existing hashtags from caption
    const existingTags = this.extractHashtags(caption);
    
    // Combine and limit to 30 total
    const allTags = [...new Set([...existingTags, ...baseTags])];
    return allTags.slice(0, 30);
  }

  // Removed getTrendingAudio method - now using trendingAudioService

  private calculateScheduleTime(settings: any): Date {
    const [hours, minutes] = (settings.postTime || '14:00').split(':').map(Number);
    const timezone = settings.timezone || 'America/Chicago'; // Default to Austin, Texas
    
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
    
    console.log(`🕐 Scheduling for ${hours}:${minutes.toString().padStart(2, '0')} ${timezone}`);
    console.log(`📅 Scheduled UTC time: ${scheduled.toISOString()}`);
    console.log(`📍 Local time: ${scheduled.toLocaleString("en-US", {timeZone: timezone})}`);
    
    return scheduled;
  }

  private async postToInstagram(post: any, settings: any): Promise<void> {
    try {
      console.log(`📸 Posting to Instagram: ${post.originalPostId}`);
      
      if (!settings.instagramToken || !settings.instagramAccount) {
        throw new Error('Instagram credentials not configured');
      }

      // Step 1: Create media container using Facebook Graph API (like original backend)
      const formData = new URLSearchParams({
        image_url: post.mediaUrl, // Use image_url for videos too (Instagram API requirement)
        caption: `${post.newCaption}\n\n${post.hashtags.map((tag: string) => `#${tag}`).join(' ')}`,
        access_token: settings.instagramToken
      });

      const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${settings.instagramAccount}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!mediaResponse.ok) {
        const errorData = await mediaResponse.json();
        throw new Error(`Container creation failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const mediaData = await mediaResponse.json();
      const mediaId = mediaData.id;
      console.log(`📸 Instagram media container created: ${mediaId}`);

      // Step 3: Publish the media (simplified like original backend)
      const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${settings.instagramAccount}/media_publish`, {
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

      // Store the published post ID for tracking
      post.publishedInstagramId = publishedId;

    } catch (error: any) {
      console.error(`❌ Instagram posting failed for ${post.originalPostId}:`, error);
      console.error('📝 Instagram API Error Details:', error.response?.data || 'No response data');
      throw error;
    }
  }

  private async postToYouTube(post: any, settings: any): Promise<void> {
    try {
      console.log(`▶️ Posting to YouTube: ${post.originalPostId}`);
      
      if (!settings.youtubeRefresh || !settings.youtubeClientId || !settings.youtubeClientSecret) {
        throw new Error('YouTube credentials not configured');
      }

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

      // Step 2: Download the video content
      const videoResponse = await axios.get(post.mediaUrl, { responseType: 'stream' });
      
      // Step 3: Create form data for multipart upload
      const form = new FormData();
      
      // Video metadata
      const metadata = {
        snippet: {
          title: post.newCaption.substring(0, 100), // YouTube title limit
          description: `${post.newCaption}\n\n${post.hashtags.map((tag: string) => `#${tag}`).join(' ')}`,
          tags: post.hashtags,
          categoryId: '22', // People & Blogs category
          defaultLanguage: 'en'
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false
        }
      };

      form.append('part', 'snippet,status');
      form.append('metadata', JSON.stringify(metadata), {
        contentType: 'application/json'
      });
      form.append('media', videoResponse.data, {
        filename: `${post.originalPostId}.mp4`,
        contentType: 'video/mp4'
      });

      // Step 4: Upload to YouTube
      const uploadResponse = await axios.post('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart', form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const videoId = uploadResponse.data.id;
      console.log(`✅ YouTube video uploaded successfully: ${videoId}`);

      // Store the published video ID for tracking
      post.publishedYouTubeId = videoId;

    } catch (error: any) {
      console.error(`❌ YouTube posting failed for ${post.originalPostId}:`, error);
      console.error('📝 YouTube API Error Details:', error.response?.data || 'No response data');
      throw error;
    }
  }

  private async saveToDropbox(post: any, settings: any): Promise<void> {
    try {
      console.log(`💾 Saving to Dropbox: ${post.originalPostId}`);
      
      if (!settings.dropboxToken) {
        throw new Error('Dropbox token not configured');
      }

      // Import Dropbox SDK
      const { Dropbox } = require('dropbox');
      const dbx = new Dropbox({ accessToken: settings.dropboxToken });

      // Step 1: Download the video content
      const videoResponse = await axios.get(post.mediaUrl, { responseType: 'arraybuffer' });
      const videoBuffer = Buffer.from(videoResponse.data);

      // Step 2: Create filename with timestamp and caption snippet
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const captionSnippet = post.newCaption.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${timestamp}_${captionSnippet}_${post.originalPostId}.mp4`;
      const dropboxPath = `${settings.dropboxFolder || '/Autopilot_Posts'}/${filename}`;

      // Step 3: Upload to Dropbox
      const uploadResponse = await dbx.filesUpload({
        path: dropboxPath,
        contents: videoBuffer,
        mode: 'add',
        autorename: true
      });

      console.log(`✅ Dropbox upload successful: ${uploadResponse.result.path_display}`);

      // Step 4: Create a shareable link
      try {
        const shareResponse = await dbx.sharingCreateSharedLinkWithSettings({
          path: uploadResponse.result.path_lower,
          settings: {
            requested_visibility: 'public'
          }
        });
        
        post.dropboxPath = uploadResponse.result.path_display;
        post.dropboxUrl = shareResponse.result.url;
        console.log(`🔗 Dropbox share link created: ${shareResponse.result.url}`);
        
      } catch (shareError) {
        // If sharing fails, still save the path
        post.dropboxPath = uploadResponse.result.path_display;
        console.log(`⚠️ Dropbox upload successful but sharing failed: ${shareError}`);
      }

      // Step 5: Save metadata file with post info
      const metadataContent = JSON.stringify({
        originalPostId: post.originalPostId,
        platform: post.targetPlatform,
        caption: post.newCaption,
        hashtags: post.hashtags,
        scheduledFor: post.scheduledFor,
        processedAt: new Date(),
        publishedInstagramId: post.publishedInstagramId,
        publishedYouTubeId: post.publishedYouTubeId,
        videoUrl: post.mediaUrl
      }, null, 2);

      const metadataPath = `${settings.dropboxFolder || '/Autopilot_Posts'}/metadata_${filename}.json`;
      await dbx.filesUpload({
        path: metadataPath,
        contents: metadataContent,
        mode: 'add',
        autorename: true
      });

      console.log(`📝 Metadata saved to Dropbox: ${metadataPath}`);

    } catch (error) {
      console.error(`❌ Dropbox backup failed for ${post.originalPostId}:`, error);
      // Don't throw error for Dropbox backup failure - it shouldn't stop the posting process
      post.dropboxError = error instanceof Error ? error.message : 'Unknown Dropbox error';
    }
  }

  private async logActivity(runId: string, type: string, status: string, details: any = {}): Promise<void> {
    await AutopilotLog.create({
      runId,
      type,
      status,
      ...details,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0
    });
  }

  /**
   * Force post all queued videos immediately (for testing)
   */
  public async forcePostAll(): Promise<{ posted: number; failed: number; processed: number; errors: string[] }> {
    const runId = require('crypto').randomUUID();
    console.log(`🚀 Force posting all queued videos (runId: ${runId})...`);

    try {
      // Get settings
      const settings = await SettingsModel.findOne({});
      if (!settings) {
        throw new Error('Settings not found');
      }

      // Get all queued posts (ignore schedule time for force posting)
      const queuedPosts = await RepostQueue.find({
        status: 'queued'
      }).sort({ priority: 1, scheduledFor: 1 });

      console.log(`📋 Found ${queuedPosts.length} queued videos to post immediately`);

      let posted = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const post of queuedPosts) {
        try {
          post.status = 'processing';
          await post.save();

          // Post to target platform
          if (post.targetPlatform === 'instagram') {
            await this.postToInstagram(post, settings);
            console.log(`✅ Posted to Instagram: ${post.originalPostId}`);
          } else if (post.targetPlatform === 'youtube') {
            await this.postToYouTube(post, settings);
            console.log(`✅ Posted to YouTube: ${post.originalPostId}`);
          }

          // Save to Dropbox if enabled
          if (settings.dropboxSave && settings.dropboxToken) {
            await this.saveToDropbox(post, settings);
          }

          post.status = 'completed';
          post.postedAt = new Date();
          await post.save();

          posted++;

          // Log successful posting
          await this.logActivity(runId, 'post', 'completed', {
            platform: post.targetPlatform,
            postId: post.originalPostId
          });

        } catch (error) {
          console.error(`❌ Failed to post ${post.originalPostId}:`, error);
          
          post.status = 'failed';
          await post.save();
          failed++;

          const errorMsg = `${post.targetPlatform} posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);

          // Log failed posting
          await this.logActivity(runId, 'post', 'failed', {
            platform: post.targetPlatform,
            postId: post.originalPostId,
            error: errorMsg
          });
        }
      }

      const result = {
        posted,
        failed,
        processed: queuedPosts.length,
        errors
      };

      console.log(`🎯 Force posting completed: ${posted} posted, ${failed} failed`);

      // Log overall run
      await this.logActivity(runId, 'force_post', 'completed', result);

      return result;

    } catch (error) {
      console.error('❌ Force posting failed:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await this.logActivity(runId, 'force_post', 'failed', { error: errorMsg });
      
      throw error;
    }
  }
}

export const autopilotService = new AutopilotService();