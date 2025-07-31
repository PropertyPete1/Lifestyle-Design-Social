/**
 * 🚀 PHASE 9 AUTOPILOT - Enhanced with GridFS + Smart AI + Post Now
 * 
 * This is the main autopilot execution file that can be:
 * 1. Called by cron runner/scheduler
 * 2. Triggered manually via POST /run-autopilot
 * 3. Triggered with "Post Now" for instant posting
 * 
 * Enhanced Features:
 * ✅ MongoDB GridFS video storage (no Dropbox dependency)
 * ✅ Smart video re-encoding to break hash fingerprinting
 * ✅ AI-powered caption rewriting with OpenAI
 * ✅ Smart scheduler OR instant "Post Now" capability
 * ✅ YouTube posting ACTIVE and working perfectly
 * 🚨 Instagram posting TEMPORARILY DISABLED (waiting for new access token)
 * ✅ Advanced duplicate prevention
 * ✅ Trending audio integration
 * ✅ High-performance video filtering (10k+ views)
 * 
 * STATUS: YouTube-only mode until Instagram permissions are fixed
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { connectToDatabase } from '../src/database/connection';
import SettingsModel from '../src/models/SettingsModel';

// Import new utilities
import { saveVideoToGridFS, getVideoFromGridFS } from '../src/utils/gridfs';
import { reencodeVideo } from '../src/utils/videoProcessor';
import { rewriteCaption, generateOptimizedHashtags } from '../src/utils/captionAI';
import { getTrendingAudio } from '../src/utils/trendingAudio';
import { schedulePost } from '../src/utils/scheduler';
import { uploadToInstagram, uploadToYouTube } from '../src/uploaders';
import { getHighPerformingInstagramVideos } from '../src/integrations/graphAPI';
import { storeRepostLog, isAlreadyReposted } from '../src/db/repostTracker';

const TEMP_DIR = path.resolve(__dirname, '../temp');
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Enhanced autopilot reposter with GridFS and smart AI features
 */
export const autopilotReposter = async ({ postNow = false } = {}) => {
  console.log(`🚀 Phase 9 Enhanced Autopilot - ${postNow ? 'POST NOW' : 'SCHEDULED'} mode`);
  
  try {
    await connectToDatabase();
    
    const settings = await SettingsModel.findOne();
    if (!settings || (!postNow && !settings.autopilot)) {
      throw new Error('Autopilot is disabled in settings');
    }

    // Get high-performing Instagram videos
    const minViews = settings.minViews || 10000;
    const posts = await getHighPerformingInstagramVideos(minViews);
    
    if (posts.length === 0) {
      console.log(`📭 No high-performing videos found (${minViews}+ views)`);
      return { success: true, processed: 0, posted: 0, errors: [] };
    }

    console.log(`📱 Found ${posts.length} high-performing videos to process`);
    
    let processed = 0;
    let posted = 0;
    const errors: string[] = [];
    
    for (const post of posts) {
      // Skip if already reposted 
      if (await isAlreadyReposted(post.id)) {
        console.log(`⏭️ Skipping ${post.id} - already reposted`);
        continue;
      }

      try {
        console.log(`🎬 Processing video: ${post.id} (${post.view_count} views)`);
        
        // Set up file paths
        const rawVideoPath = path.join(TEMP_DIR, `${post.id}-raw.mp4`);
        const reencodedPath = path.join(TEMP_DIR, `${post.id}-ready.mp4`);

        // Check GridFS first, then download if needed
        let hasMongoVideo = await getVideoFromGridFS(post.id, rawVideoPath);
        
        if (!hasMongoVideo) {
          console.log(`📥 Downloading video from Instagram: ${post.video_url}`);
          
          // Skip CDN URLs but allow external demo URLs
          if (post.video_url.includes('scontent-') || post.video_url.includes('cdninstagram.com')) {
            console.log(`🚫 Skipping Instagram CDN URL (not allowed for reposting): ${post.video_url}`);
            errors.push(`Video ${post.id}: Instagram CDN URLs cannot be reposted`);
            continue;
          }
          
          console.log(`✅ Processing external video URL: ${post.video_url}`);
          
          // Download Instagram video 
          console.log(`🔥 Downloading Instagram video for reposting...`);
          
          try {
            const videoResponse = await axios.get(post.video_url, { 
              responseType: 'arraybuffer',
              timeout: 30000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
              }
            });
            
            if (!videoResponse.data || videoResponse.data.byteLength === 0) {
              throw new Error('Downloaded video is empty');
            }
            
            fs.writeFileSync(rawVideoPath, Buffer.from(videoResponse.data, 'binary'));
            console.log(`✅ Downloaded video: ${(videoResponse.data.byteLength / 1024 / 1024).toFixed(2)}MB`);
            
            // Save to GridFS for future use
            await saveVideoToGridFS(rawVideoPath, post.id);
            console.log(`💾 Video saved to GridFS: ${post.id}`);
          } catch (downloadError: any) {
            console.error(`❌ Failed to download video ${post.id}:`, downloadError.message);
            errors.push(`Video ${post.id}: Download failed - ${downloadError.message}`);
            continue;
          }
        } else {
          console.log(`✅ Video retrieved from GridFS: ${post.id}`);
        }

        // Re-encode video to break hash fingerprinting
        await reencodeVideo(rawVideoPath, reencodedPath);

        // Generate smart captions and audio
        const igCaption = await rewriteCaption(post.caption, 'instagram');
        const ytTitle = await rewriteCaption(post.caption, 'youtube');
        const igHashtags = await generateOptimizedHashtags(igCaption, 'instagram');
        const ytHashtags = await generateOptimizedHashtags(ytTitle, 'youtube');
        
        const igAudio = await getTrendingAudio('instagram');
        const ytAudio = await getTrendingAudio('youtube');

        // Smart scheduler or post now
        const igTime = postNow ? new Date() : await schedulePost('instagram');
        const ytTime = postNow ? new Date() : await schedulePost('youtube');

        // Upload to platforms based on settings
        let instagramId = null;
        let youtubeId = null;
        
        // Add delay to prevent OpenAI rate limiting
        await sleep(2000);
        
        console.log(`🎯 Platform settings: Instagram=${settings.postToInstagram}, YouTube=${settings.postToYouTube}`);
        
        // Instagram posting (only if enabled in settings)
        if (settings.postToInstagram === true) {
          try {
            const igCaptionWithHashtags = `${igCaption}\n\n${igHashtags.map(tag => `#${tag}`).join(' ')}`;
            instagramId = await uploadToInstagram({
              videoPath: reencodedPath,
              caption: igCaptionWithHashtags,
              audio: igAudio,
              scheduledTime: postNow ? new Date() : igTime
            });
            console.log(`📸 Instagram upload result: ${instagramId}`);
          } catch (igError) {
            console.error(`❌ Instagram upload failed:`, igError);
            errors.push(`Instagram: ${igError instanceof Error ? igError.message : 'Unknown error'}`);
          }
        } else {
          console.log(`📸 Instagram posting disabled in settings`);
        }

        // YouTube posting (only if enabled in settings)
        if (settings.postToYouTube === true) {
          try {
            youtubeId = await uploadToYouTube({
              videoPath: reencodedPath,
              title: ytTitle,
              audio: ytAudio,
              scheduledTime: postNow ? new Date() : ytTime
            });
            console.log(`▶️ YouTube upload result: ${youtubeId}`);
          } catch (ytError) {
            console.error(`❌ YouTube upload failed:`, ytError);
            errors.push(`YouTube: ${ytError instanceof Error ? ytError.message : 'Unknown error'}`);
          }
        } else {
          console.log(`▶️ YouTube posting disabled in settings`);
        }

        // Log successful reposts for each platform separately
        if (instagramId) {
          await storeRepostLog(post.id, {
            caption: igCaption,
            timestamp: new Date().toISOString(),
            platform: 'instagram',
            publishedId: instagramId
          });
        }
        
        if (youtubeId) {
          await storeRepostLog(post.id, {
            caption: ytTitle,
            timestamp: new Date().toISOString(),
            platform: 'youtube',
            publishedId: youtubeId
          });
        }
        
        if (instagramId || youtubeId) {
          posted++;
        }

        // Clean up temp files
        [rawVideoPath, reencodedPath].forEach(file => {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        });

        processed++;

        // If not posting now, add delay between posts
        if (!postNow && processed < posts.length) {
          const delay = Math.floor(Math.random() * (3 * 60 * 60 * 1000 - 60 * 60 * 1000)) + 60 * 60 * 1000; // 1-3 hours
          console.log(`⏱️ Waiting ${Math.round(delay / 1000 / 60)} minutes before next post...`);
          await sleep(delay);
        }

      } catch (error) {
        console.error(`❌ Failed to process video ${post.id}:`, error);
        errors.push(`${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // In postNow mode, only process one video
      if (postNow) break;
    }

    console.log(`🎯 Autopilot completed: ${processed} processed, ${posted} posted`);
    
    // Determine actual success based on posts and errors
    const hasSuccessfulPosts = posted > 0;
    const hasErrors = errors.length > 0;
    const actualSuccess = hasSuccessfulPosts || (processed > 0 && !hasErrors);
    
    let message: string;
    if (posted > 0) {
      message = `✅ Success! Posted ${posted} of ${processed} videos processed`;
    } else if (processed > 0 && hasErrors) {
      message = `❌ Failed to post any videos. Processed ${processed} but encountered ${errors.length} errors`;
    } else if (processed === 0) {
      message = `📭 No eligible videos found for posting`;
    } else {
      message = `⚠️ Processed ${processed} videos but none were posted successfully`;
    }
    
    return {
      success: actualSuccess,
      processed,
      posted,
      errors,
      message
    };

  } catch (error) {
    console.error('❌ Autopilot reposter failed:', error);
    return {
      success: false,
      processed: 0,
      posted: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      message: 'Autopilot execution failed'
    };
  }
};

/**
 * Main autopilot execution function (backward compatibility)
 */
export async function runAutopilot(options: { postNow?: boolean } = {}) {
  return await autopilotReposter(options);
}

/**
 * If this file is run directly (for testing or manual execution)
 */
if (require.main === module) {
  console.log('🔧 Running Phase 9 Enhanced Autopilot directly...');
  
  // Check for postNow argument
  const postNow = process.argv.includes('--post-now') || process.argv.includes('--now');
  
  runAutopilot({ postNow })
    .then((result) => {
      console.log('📋 Final result:', result);
      if (result.errors && result.errors.length > 0) {
        console.log('⚠️ Errors encountered:', result.errors);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export default runAutopilot;