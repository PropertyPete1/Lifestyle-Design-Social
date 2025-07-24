import { matchAudioToVideo, AudioMatchResult } from './matchAudioToVideo';
import YouTubeVideo from '../../models/YouTubeVideo';

export interface VideoUploadData {
  title: string;
  description: string;
  tags: string[];
  filePath: string;
  audioTrackId?: string;
}

export interface UploadResult {
  success: boolean;
  videoId?: string;
  audioMatch?: AudioMatchResult;
  error?: string;
  metadata?: {
    title: string;
    description: string;
    tags: string[];
    audioTrackId?: string;
  };
}

/**
 * Upload video to YouTube with automatic audio matching
 * Note: This is a simulation - actual YouTube API integration would require authentication and API setup
 */
export async function uploadVideoToYoutube(uploadData: VideoUploadData): Promise<UploadResult> {
  try {
    console.log('🎬 Preparing video upload to YouTube...');
    
    // Match audio to video content before upload
    const audioMatch = await matchAudioToVideo(
      uploadData.title,
      uploadData.description,
      uploadData.tags
    );
    
    // Use matched audio track if available, otherwise use provided audioTrackId
    const finalAudioTrackId = audioMatch.audioTrackId || uploadData.audioTrackId;
    
    if (finalAudioTrackId) {
      console.log(`🎵 Using audio track: ${finalAudioTrackId}`);
    }
    
    // Simulate YouTube upload (in production, this would use YouTube Data API v3)
    const simulatedVideoId = `yt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save video metadata to database
    const videoRecord = new YouTubeVideo({
      videoId: simulatedVideoId,
      title: uploadData.title,
      description: uploadData.description,
      tags: uploadData.tags,
      publishedAt: new Date().toISOString(),
      alreadyPosted: false,
      audioTrackId: finalAudioTrackId,
      viewCount: 0,
      likeCount: 0
    });
    
    await videoRecord.save();
    
    console.log(`✅ Video uploaded successfully: ${simulatedVideoId}`);
    
    return {
      success: true,
      videoId: simulatedVideoId,
      audioMatch,
      metadata: {
        title: uploadData.title,
        description: uploadData.description,
        tags: uploadData.tags,
        audioTrackId: finalAudioTrackId
      }
    };
    
  } catch (error) {
    console.error('❌ Video upload failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Prepare video metadata with audio matching for manual upload
 */
export async function prepareVideoForUpload(
  title: string,
  description: string = '',
  tags: string[] = []
): Promise<{
  metadata: VideoUploadData;
  audioMatch: AudioMatchResult;
}> {
  console.log('📝 Preparing video metadata with audio matching...');
  
  // Get audio match recommendation
  const audioMatch = await matchAudioToVideo(title, description, tags);
  
  const metadata: VideoUploadData = {
    title,
    description,
    tags,
    filePath: '', // To be filled by user
    audioTrackId: audioMatch.audioTrackId || undefined
  };
  
  return {
    metadata,
    audioMatch
  };
}

/**
 * Batch prepare multiple videos for upload
 */
export async function batchPrepareVideosForUpload(
  videos: Array<{ title: string; description?: string; tags?: string[] }>
): Promise<Array<{
  metadata: VideoUploadData;
  audioMatch: AudioMatchResult;
}>> {
  console.log(`📝 Batch preparing ${videos.length} videos with audio matching...`);
  
  const results = [];
  
  for (const video of videos) {
    const result = await prepareVideoForUpload(
      video.title,
      video.description || '',
      video.tags || []
    );
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Batch preparation complete for ${videos.length} videos`);
  
  return results;
}

/**
 * Update existing video with audio track
 */
export async function updateVideoAudioTrack(
  videoId: string,
  audioTrackId: string
): Promise<boolean> {
  try {
    console.log(`🎵 Updating video ${videoId} with audio track ${audioTrackId}...`);
    
    const result = await YouTubeVideo.updateOne(
      { videoId },
      { audioTrackId }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Video ${videoId} updated with audio track`);
      return true;
    } else {
      console.log(`⚠️ Video ${videoId} not found or already has this audio track`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Failed to update video ${videoId}:`, error);
    return false;
  }
} 