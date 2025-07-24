import YouTubeVideo, { IYouTubeVideo } from '../../models/YouTubeVideo';
import { 
  generateVideoFingerprint, 
  analyzeVideoBuffer, 
  compareFingerprints, 
  createVideoSignature,
  VideoFingerprint,
  VideoMatch 
} from './videoFingerprint';

interface MatchResult {
  isMatch: boolean;
  confidence: number;
  originalVideo?: {
    title: string;
    description: string;
    tags: string[];
    videoId: string;
    viewCount: number;
    likeCount: number;
  };
}

/**
 * Match uploaded video against YouTube database using content fingerprinting
 * @param videoBuffer - The actual video file buffer
 * @param filename - Optional filename for logging
 * @returns Match result with confidence score
 */
export async function matchVideoContent(
  videoBuffer: Buffer,
  filename?: string
): Promise<MatchResult> {
  try {
    console.log(`🔍 Analyzing video content${filename ? ` for: ${filename}` : ''}...`);
    
    // Generate fingerprint from uploaded video
    const uploadedFingerprint = analyzeVideoBuffer(videoBuffer);
    console.log(`📊 Video analysis: ${uploadedFingerprint.fileSize} bytes, hash: ${uploadedFingerprint.contentHash}`);

    if (!uploadedFingerprint.contentHash) {
      console.log('❌ Could not generate content hash');
      return { isMatch: false, confidence: 0 };
    }

    // First, try exact content hash match (fastest)
    const exactMatch = await YouTubeVideo.findOne({
      'videoFingerprint.contentHash': uploadedFingerprint.contentHash
    });

    if (exactMatch) {
      console.log(`🎯 EXACT MATCH FOUND: "${exactMatch.title}"`);
      return {
        isMatch: true,
        confidence: 100,
        originalVideo: {
          title: exactMatch.title,
          description: exactMatch.description,
          tags: exactMatch.tags,
          videoId: exactMatch.videoId,
          viewCount: exactMatch.viewCount,
          likeCount: exactMatch.likeCount
        }
      };
    }

    // If no exact match, look for similar videos based on file size and duration
    const similarSizeRange = 0.2; // ±20% file size
    const minSize = uploadedFingerprint.fileSize! * (1 - similarSizeRange);
    const maxSize = uploadedFingerprint.fileSize! * (1 + similarSizeRange);

    const candidates = await YouTubeVideo.find({
      $or: [
        // Videos with similar file sizes
        {
          'videoFingerprint.fileSize': {
            $gte: minSize,
            $lte: maxSize
          }
        },
        // Videos with similar duration (if we have duration)
        ...(uploadedFingerprint.duration ? [{
          'videoFingerprint.duration': {
            $gte: uploadedFingerprint.duration * 0.8,
            $lte: uploadedFingerprint.duration * 1.2
          }
        }] : [])
      ]
    }).limit(20); // Limit candidates for performance

    console.log(`🔍 Found ${candidates.length} potential matches to analyze`);

    let bestMatch: IYouTubeVideo | null = null;
    let bestConfidence = 0;

    // Compare fingerprints with each candidate
    for (const candidate of candidates) {
      if (!candidate.videoFingerprint) continue;

      const candidateFingerprint: VideoFingerprint = {
        contentHash: candidate.videoFingerprint.contentHash,
        fileSize: candidate.videoFingerprint.fileSize || 0,
        duration: candidate.videoFingerprint.duration,
        aspectRatio: candidate.videoFingerprint.aspectRatio
      };

      const confidence = compareFingerprints(
        uploadedFingerprint as VideoFingerprint, 
        candidateFingerprint
      );

      console.log(`📊 "${candidate.title.substring(0, 40)}..." - Confidence: ${confidence}%`);

      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = candidate;
      }
    }

    // Consider it a match if confidence is above threshold
    const matchThreshold = 75; // 75% confidence required
    
    if (bestMatch && bestConfidence >= matchThreshold) {
      console.log(`✅ MATCH FOUND: "${bestMatch.title}" (${bestConfidence}% confidence)`);
      return {
        isMatch: true,
        confidence: bestConfidence,
        originalVideo: {
          title: bestMatch.title,
          description: bestMatch.description,
          tags: bestMatch.tags,
          videoId: bestMatch.videoId,
          viewCount: bestMatch.viewCount,
          likeCount: bestMatch.likeCount
        }
      };
    }

    console.log(`❌ No match found. Best confidence: ${bestConfidence}% (threshold: ${matchThreshold}%)`);
    return { 
      isMatch: false, 
      confidence: bestConfidence 
    };

  } catch (error) {
    console.error('Error matching video content:', error);
    return { isMatch: false, confidence: 0 };
  }
}

/**
 * Store video fingerprint for a YouTube video (for future matching)
 * This would be called when downloading/processing YouTube videos
 */
export async function storeVideoFingerprint(
  videoId: string, 
  videoBuffer: Buffer, 
  metadata?: any
): Promise<void> {
  try {
    const fingerprint = generateVideoFingerprint(videoBuffer, metadata);
    const signature = createVideoSignature(fingerprint);

    await YouTubeVideo.findOneAndUpdate(
      { videoId },
      {
        $set: {
          videoFingerprint: {
            contentHash: fingerprint.contentHash,
            fileSize: fingerprint.fileSize,
            duration: fingerprint.duration,
            aspectRatio: fingerprint.aspectRatio,
            signature: signature
          }
        }
      }
    );

    console.log(`📁 Stored fingerprint for video ${videoId}: ${signature}`);
  } catch (error) {
    console.error('Error storing video fingerprint:', error);
  }
} 