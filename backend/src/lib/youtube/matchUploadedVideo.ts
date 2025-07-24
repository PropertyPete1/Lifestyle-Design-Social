import YouTubeVideo, { IYouTubeVideo } from '../../models/YouTubeVideo';

interface MatchResult {
  isMatch: boolean;
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
 * Detects if an uploaded video has already been posted to YouTube
 * @param filename - The uploaded video filename
 * @param videoFingerprint - Optional video fingerprint/hash for advanced matching
 * @returns Match result with original video data if found
 */
export async function matchUploadedVideo(
  filename: string,
  videoFingerprint?: string
): Promise<MatchResult> {
  try {
    // Clean filename for comparison (remove extension, special chars, normalize)
    const cleanFilename = filename
      .toLowerCase()
      .replace(/\.(mp4|mov|avi|mkv|wmv|flv)$/i, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Search for potential matches in YouTube videos
    const potentialMatches = await YouTubeVideo.find({
      $or: [
        // Match by title similarity (70%+ match)
        {
          $expr: {
            $gte: [
              {
                $divide: [
                  { $strLenCP: { $toString: "$title" } },
                  { $add: [{ $strLenCP: { $toString: "$title" } }, cleanFilename.length] }
                ]
              },
              0.7
            ]
          }
        },
        // Match by description containing filename keywords
        {
          description: {
            $regex: cleanFilename.split(' ').filter(word => word.length > 3).join('|'),
            $options: 'i'
          }
        }
      ]
    }).sort({ viewCount: -1 }).limit(10);

    // Find best match using fuzzy string matching
    let bestMatch: IYouTubeVideo | null = null;
    let bestScore = 0;

    for (const video of potentialMatches) {
      const titleScore = calculateSimilarity(cleanFilename, video.title.toLowerCase());
      const descScore = calculateSimilarity(cleanFilename, video.description.toLowerCase());
      const tagsScore = video.tags.some(tag => 
        cleanFilename.includes(tag.toLowerCase()) || tag.toLowerCase().includes(cleanFilename)
      ) ? 0.3 : 0;

      const totalScore = Math.max(titleScore, descScore) + tagsScore;

      if (totalScore > bestScore && totalScore > 0.6) {
        bestScore = totalScore;
        bestMatch = video;
      }
    }

    if (bestMatch) {
      return {
        isMatch: true,
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

    return { isMatch: false };

  } catch (error) {
    console.error('Error matching uploaded video:', error);
    return { isMatch: false };
  }
}

/**
 * Calculate similarity between two strings using Jaccard similarity
 */
function calculateSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(' ').filter(word => word.length > 2));
  const set2 = new Set(str2.split(' ').filter(word => word.length > 2));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
} 