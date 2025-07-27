import { RepostQueue, IRepostQueue } from '../../models/RepostQueue';
import { VideoStatus, IVideoStatus } from '../../models/VideoStatus';
import { InstagramContent } from '../../models/InstagramContent';
import { prepareSmartCaption } from './prepareSmartCaption';
import { matchAudioToVideo } from './matchAudioToVideo';
import { schedulePostJob } from './schedulePostJob';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class Phase9InstagramReposter {
  private uploadsDir: string;
  private accessToken: string;
  private businessAccountId: string;

  constructor(accessToken: string, businessAccountId: string) {
    this.uploadsDir = path.join(__dirname, '../../../uploads');
    this.accessToken = accessToken;
    this.businessAccountId = businessAccountId;
    
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Process pending Instagram reposts from the queue
   */
  async processInstagramReposts(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      console.log('📱 Phase 9: Processing Instagram reposts...');

      // Get pending Instagram reposts that are ready to be processed
      const pendingReposts = await RepostQueue.find({
        targetPlatform: 'instagram',
        status: 'queued',
        scheduledFor: { $lte: new Date() }
      })
      .sort({ priority: 1 }) // Process highest priority first
      .limit(5); // Process in batches

      console.log(`📸 Found ${pendingReposts.length} Instagram reposts ready for processing`);

      for (const repost of pendingReposts) {
        results.processed++;
        
        try {
          // Mark as processing
          repost.status = 'processing';
          repost.processedAt = new Date();
          await repost.save();

          console.log(`🔄 Processing Instagram repost: ${repost.sourceMediaId} (priority ${repost.priority})`);

          // Download and process the Instagram video (repost with fresh angle)
          const processedVideo = await this.downloadAndProcessVideo(repost);
          
          if (!processedVideo) {
            throw new Error('Failed to download or process video');
          }

          // Generate optimized caption for Instagram Reels
          const optimizedCaption = await this.generateInstagramCaption(repost);

          // Match trending Instagram audio
          const audioMatch = await this.matchInstagramAudio(processedVideo.filePath);

          // Create VideoStatus entry for the repost
          const videoStatus = await this.createVideoStatusEntry(repost, processedVideo, optimizedCaption, audioMatch);

          // Schedule the post using Phase 6 scheduler
          await this.scheduleInstagramPost(videoStatus, optimizedCaption, audioMatch);

          // Update repost queue
          repost.status = 'completed';
          repost.repostVideoId = videoStatus.videoId;
          repost.repostContent = {
            newCaption: optimizedCaption.finalCaption,
            newHashtags: optimizedCaption.hashtags,
            audioTrackId: audioMatch?.audioId,
            optimizedForPlatform: 'instagram'
          };
          await repost.save();

          results.successful++;
          console.log(`✅ Instagram repost completed: ${repost.sourceMediaId} -> ${videoStatus.videoId}`);

        } catch (error) {
          console.error(`❌ Failed to process Instagram repost ${repost.sourceMediaId}:`, error);
          
          // Update repost with error
          repost.status = 'failed';
          repost.errorMessage = error instanceof Error ? error.message : 'Unknown error';
          repost.retryCount = (repost.retryCount || 0) + 1;
          await repost.save();

          results.failed++;
          results.errors.push(`${repost.sourceMediaId}: ${repost.errorMessage}`);
        }
      }

      console.log(`📱 Instagram repost processing complete: ${results.successful}/${results.processed} successful`);
      return results;

    } catch (error) {
      console.error('❌ Error in Instagram repost processing:', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return results;
    }
  }

  /**
   * Download Instagram video and prepare for repost with fresh angle
   */
  private async downloadAndProcessVideo(repost: IRepostQueue): Promise<{
    filePath: string;
    filename: string;
    fileHash: string;
    fileSize: number;
  } | null> {
    try {
      console.log(`⬇️ Downloading video for Instagram repost: ${repost.originalContent.media_url}`);

      // Download the video file
      const response = await axios({
        method: 'GET',
        url: repost.originalContent.media_url,
        responseType: 'stream',
        timeout: 30000 // 30 seconds timeout
      });

      // Generate unique filename
      const timestamp = Date.now();
      const hash = crypto.randomBytes(16).toString('hex');
      const filename = `ig_repost_${timestamp}_${hash}.mp4`;
      const filePath = path.join(this.uploadsDir, filename);

      // Save video to disk
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          try {
            // Calculate file info
            const stats = fs.statSync(filePath);
            const fileBuffer = fs.readFileSync(filePath);
            const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

            console.log(`✅ Video downloaded for Instagram repost: ${filename} (${Math.round(stats.size / 1024)}KB)`);

            resolve({
              filePath,
              filename,
              fileHash,
              fileSize: stats.size
            });
          } catch (error) {
            reject(error);
          }
        });

        writer.on('error', reject);
      });

    } catch (error) {
      console.error(`❌ Error downloading video for ${repost.sourceMediaId}:`, error);
      return null;
    }
  }

  /**
   * Generate optimized caption for Instagram Reels with fresh angle
   */
  private async generateInstagramCaption(repost: IRepostQueue): Promise<{
    finalCaption: string;
    hashtags: string[];
    freshAngle: string;
  }> {
    try {
      console.log(`📝 Generating Instagram caption with fresh angle for: ${repost.sourceMediaId}`);

      // Use Phase 4 smart caption system with Instagram optimization
      const originalContent = {
        title: repost.originalContent.caption.substring(0, 100),
        description: repost.originalContent.caption,
        tags: repost.originalContent.hashtags
      };
      
      // Load OpenAI API key from settings
      const settingsPath = path.join(__dirname, '../../../settings.json');
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      
      const smartCaption = await prepareSmartCaption(
        originalContent,
        settings.openaiApiKey,
        'instagram'
      );

      // Create fresh angle for the repost
      const freshAngle = this.generateFreshAngle(repost.originalContent.caption);
      
      // Combine fresh angle with optimized caption
      let finalCaption = `${freshAngle}\n\n${smartCaption.versionA.description}`;
      
      // Add Instagram-specific optimization
      finalCaption = this.optimizeForInstagram(finalCaption);

      // Get top 30 Instagram hashtags
      const instagramHashtags = await this.getTop30InstagramHashtags(repost.originalContent.caption);

      // Ensure caption stays under 2200 character limit
      if (finalCaption.length > 2200) {
        finalCaption = finalCaption.substring(0, 2150) + '...';
      }

      return {
        finalCaption,
        hashtags: instagramHashtags,
        freshAngle
      };

    } catch (error) {
      console.error(`❌ Error generating Instagram caption for ${repost.sourceMediaId}:`, error);
      
      // Fallback caption
      return {
        finalCaption: this.createFallbackCaption(repost.originalContent.caption),
        hashtags: this.getDefaultInstagramHashtags(),
        freshAngle: 'Check out this amazing content!'
      };
    }
  }

  /**
   * Generate a fresh angle for reposting content
   */
  private generateFreshAngle(originalCaption: string): string {
    const freshAngles = [
      '🔥 This is still relevant today!',
      '💯 Throwback to this amazing content!',
      '⭐ Worth sharing again!',
      '🚀 Still getting requests to repost this!',
      '💎 Classic content that never gets old!',
      '✨ By popular demand, here it is again!',
      '🎯 This hit different when I first posted it!',
      '🔄 Bringing this back because it\'s so good!',
      '📌 Pinning this again for new followers!',
      '🌟 Still one of my favorites!'
    ];

    // Try to be more specific based on content
    const lowerCaption = originalCaption.toLowerCase();
    
    if (lowerCaption.includes('sold') || lowerCaption.includes('success')) {
      return '🎉 Still celebrating this success! Worth sharing again!';
    } else if (lowerCaption.includes('luxury') || lowerCaption.includes('stunning')) {
      return '✨ This luxury property is still taking my breath away!';
    } else if (lowerCaption.includes('market') || lowerCaption.includes('tips')) {
      return '📈 These tips are still relevant in today\'s market!';
    } else if (lowerCaption.includes('home') || lowerCaption.includes('house')) {
      return '🏡 Still dreaming about this beautiful home!';
    }

    // Return random fresh angle
    return freshAngles[Math.floor(Math.random() * freshAngles.length)];
  }

  /**
   * Optimize caption specifically for Instagram algorithm
   */
  private optimizeForInstagram(caption: string): string {
    // Add Instagram-specific engagement hooks if not present
    const instagramHooks = [
      'Double tap if you love this! ❤️',
      'Save this for later! 💾',
      'Share with someone who needs to see this! 👆',
      'What\'s your favorite feature? Comment below! 👇',
      'Tag someone who would love this! 🏷️',
      'Follow for more content like this! 🔔'
    ];

    // Add a hook if caption doesn't have engagement elements
    if (!caption.match(/double tap|save|share|comment|tag|follow|like|love/i)) {
      const randomHook = instagramHooks[Math.floor(Math.random() * instagramHooks.length)];
      caption += `\n\n${randomHook}`;
    }

    // Ensure proper spacing and readability
    caption = caption.replace(/\n{3,}/g, '\n\n'); // Max 2 line breaks
    
    return caption;
  }

  /**
   * Get top 30 trending Instagram hashtags
   */
  private async getTop30InstagramHashtags(originalCaption: string): Promise<string[]> {
    try {
      // Extract existing hashtags from original content
      const existingHashtags = originalCaption.match(/#[\w\u0590-\u05ff]+/g) || [];
      
      // Instagram-optimized hashtags for real estate content
      const instagramHashtags = [
        '#realestate',
        '#realtor',
        '#property',
        '#dreamhome',
        '#luxuryhomes',
        '#reels',
        '#instagram',
        '#viral',
        '#trending',
        '#homesweethome',
        '#propertyinvestment',
        '#realestatetips',
        '#homebuying',
        '#lifestyledesign',
        '#luxurylifestyle',
        '#propertytour',
        '#housegoals',
        '#realestateagent',
        '#investmentproperty',
        '#househunting',
        '#realestatelife',
        '#propertymarket',
        '#homedesign',
        '#architecture',
        '#interiordesign',
        '#modernhome',
        '#luxuryrealestate',
        '#realestatedeal',
        '#propertyexpert',
        '#realtorlife'
      ];

      // Combine and prioritize, removing duplicates
      const combinedHashtags = [...new Set([...existingHashtags, ...instagramHashtags])];
      
      // Return top 30
      return combinedHashtags.slice(0, 30);

    } catch (error) {
      console.error('❌ Error getting Instagram hashtags:', error);
      return this.getDefaultInstagramHashtags();
    }
  }

  /**
   * Get default Instagram hashtags as fallback
   */
  private getDefaultInstagramHashtags(): string[] {
    return [
      '#realestate',
      '#realtor',
      '#property',
      '#dreamhome',
      '#luxuryhomes',
      '#reels',
      '#instagram',
      '#viral',
      '#trending',
      '#lifestyledesign'
    ];
  }

  /**
   * Match trending Instagram audio using Phase 3 logic
   */
  private async matchInstagramAudio(videoPath: string): Promise<{ audioId: string; audioTitle: string } | null> {
    try {
      console.log(`🎵 Matching Instagram audio for video: ${videoPath}`);
      
      // Use existing Phase 3 audio matching with Instagram focus
      const audioMatch = await matchAudioToVideo(videoPath, 'instagram');
      
      if (audioMatch && audioMatch.audioTrackId) {
        console.log(`✅ Instagram audio matched: ${audioMatch.audioTrack?.title || audioMatch.audioTrackId}`);
        return {
          audioId: audioMatch.audioTrackId,
          audioTitle: audioMatch.audioTrack?.title || 'Trending Audio'
        };
      }

      return null;

    } catch (error) {
      console.error('❌ Error matching Instagram audio:', error);
      return null;
    }
  }

  /**
   * Create VideoStatus entry for the reposted content
   */
  private async createVideoStatusEntry(
    repost: IRepostQueue,
    processedVideo: { filePath: string; filename: string; fileHash: string; fileSize: number },
    caption: { finalCaption: string; hashtags: string[]; freshAngle: string },
    audioMatch: { audioId: string; audioTitle: string } | null
  ): Promise<IVideoStatus> {
    try {
      // Generate unique video ID
      const videoId = `repost_ig_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

      const videoStatus = new VideoStatus({
        videoId,
        uploadDate: new Date(),
        platform: 'instagram',
        captionGenerated: true,
        posted: false,
        filename: processedVideo.filename,
        filePath: processedVideo.filePath,
        status: 'ready',
        fingerprint: {
          hash: processedVideo.fileHash,
          size: processedVideo.fileSize
        },
        repostData: {
          originalVideoId: repost.sourceMediaId,
          originalCaption: repost.originalContent.caption,
          newCaption: caption.finalCaption,
          isRepost: true
        },
        // Phase 9 specific fields
        phase9Status: 'repost_candidate',
        phase9SourceMediaId: repost.sourceMediaId,
        phase9PerformanceScore: repost.originalContent.performanceScore,
        phase9RepostPlatforms: ['instagram'],
        phase9ContentType: 'repurposed_from_ig',
        phase9OriginalUrl: repost.originalContent.permalink,
        phase9RepostCount: 1
      });

      await videoStatus.save();
      console.log(`✅ VideoStatus created for Instagram repost: ${videoId}`);

      return videoStatus;

    } catch (error) {
      console.error('❌ Error creating VideoStatus entry:', error);
      throw error;
    }
  }

  /**
   * Schedule Instagram post using Phase 6 scheduler
   */
  private async scheduleInstagramPost(
    videoStatus: IVideoStatus,
    caption: { finalCaption: string; hashtags: string[]; freshAngle: string },
    audioMatch: { audioId: string; audioTitle: string } | null
  ): Promise<void> {
    try {
      console.log(`⏰ Scheduling Instagram post: ${videoStatus.videoId}`);

      // Use Phase 6 scheduler to find optimal posting time
      await schedulePostJob({
        videoId: videoStatus.videoId,
        scheduledTime: new Date(Date.now() + 60000), // Schedule for 1 minute
        title: caption.freshAngle,
        description: caption.finalCaption,
        tags: caption.hashtags,
        audioTrackId: audioMatch?.audioId
      });

      console.log(`✅ Instagram post scheduled: ${videoStatus.videoId}`);

    } catch (error) {
      console.error(`❌ Error scheduling Instagram post for ${videoStatus.videoId}:`, error);
      throw error;
    }
  }

  /**
   * Create fallback caption when smart caption generation fails
   */
  private createFallbackCaption(originalCaption: string): string {
    const freshAngle = '✨ Bringing back this amazing content!';
    
    // Clean up original caption and add fresh angle
    let fallback = originalCaption.substring(0, 1800); // Leave room for hashtags
    fallback = `${freshAngle}\n\n${fallback}`;
    
    // Add Instagram engagement hook
    fallback += '\n\nDouble tap if you love this! ❤️';

    return fallback;
  }

  /**
   * Get processing statistics for Instagram reposts
   */
  async getInstagramRepostStats(): Promise<{
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    totalReposted: number;
    avgPerformanceScore: number;
  }> {
    try {
      const stats = await RepostQueue.aggregate([
        { $match: { targetPlatform: 'instagram' } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgScore: { $avg: '$originalContent.performanceScore' }
          }
        }
      ]);

      const result = {
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalReposted: 0,
        avgPerformanceScore: 0
      };

      let totalScore = 0;
      let totalCount = 0;

      stats.forEach(stat => {
        const status = stat._id as keyof typeof result;
        if (status in result && typeof result[status] === 'number') {
          result[status] = stat.count;
          totalScore += stat.avgScore * stat.count;
          totalCount += stat.count;
        }
      });

      result.totalReposted = result.completed;
      result.avgPerformanceScore = totalCount > 0 ? Math.round(totalScore / totalCount) : 0;

      return result;

    } catch (error) {
      console.error('❌ Error getting Instagram repost stats:', error);
      return {
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalReposted: 0,
        avgPerformanceScore: 0
      };
    }
  }
} 