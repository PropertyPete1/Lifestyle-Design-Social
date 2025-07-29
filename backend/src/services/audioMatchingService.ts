import { AudioMatch, IAudioMatch } from '../models/AudioMatch';
import { VideoStatus, IVideoStatus } from '../models/VideoStatus';
import YouTubeVideo, { IYouTubeVideo } from '../models/YouTubeVideo';
import { TrendingAudioScraper, TrendingAudio } from './trendingAudioScraper';

export interface VideoMatchData {
  videoId: string;
  platform: 'youtube' | 'instagram';
  title: string;
  description: string;
  tags: string[];
  keywords: string[];
}

export class AudioMatchingService {
  private audioScraper: TrendingAudioScraper;

  constructor() {
    this.audioScraper = new TrendingAudioScraper();
  }

  /**
   * Match a single video with trending audio
   */
  async matchVideoWithAudio(videoId: string): Promise<IAudioMatch | null> {
    try {
      // Get video data
      const videoData = await this.getVideoData(videoId);
      if (!videoData) {
        console.warn(`Video data not found for videoId: ${videoId}`);
        return null;
      }

      // Get trending audio for the platform
      const trendingAudio = await this.getTrendingAudioForPlatform(videoData.platform);
      if (trendingAudio.length === 0) {
        console.warn(`No trending audio found for platform: ${videoData.platform}`);
        return null;
      }

      // Find best audio match
      const bestMatch = this.findBestAudioMatch(videoData, trendingAudio);
      if (!bestMatch) {
        console.warn(`No suitable audio match found for videoId: ${videoId}`);
        return null;
      }

      // Save the match to database
      const audioMatch = new AudioMatch({
        videoId: videoData.videoId,
        matchedAudio: bestMatch.audio.title,
        platform: videoData.platform,
        audioMetadata: {
          title: bestMatch.audio.title,
          artist: bestMatch.audio.artist,
          duration: bestMatch.audio.duration,
          trending_rank: bestMatch.audio.trending_rank,
          platform_audio_id: bestMatch.audio.platform_audio_id,
          category: bestMatch.audio.category
        },
        matchingFactors: bestMatch.matchingFactors,
        status: 'matched'
      });

      await audioMatch.save();
      console.log(`✅ Audio matched for video ${videoId}: ${bestMatch.audio.title} (Score: ${bestMatch.matchingFactors.overallScore})`);
      
      return audioMatch;
    } catch (error) {
      console.error(`Error matching audio for video ${videoId}:`, error);
      return null;
    }
  }

  /**
   * Match all pending videos with trending audio
   */
  async matchAllPendingVideos(): Promise<IAudioMatch[]> {
    try {
      // Get all videos that don't have audio matches yet
      const videoStatuses = await VideoStatus.find({
        status: { $in: ['ready', 'pending'] }
      });

      const matches: IAudioMatch[] = [];
      
      for (const videoStatus of videoStatuses) {
        // Check if already has a recent audio match
        const existingMatch = await AudioMatch.findOne({
          videoId: videoStatus.videoId,
          matchedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        if (!existingMatch) {
          const match = await this.matchVideoWithAudio(videoStatus.videoId);
          if (match) {
            matches.push(match);
          }
        }
      }

      console.log(`🎵 Matched ${matches.length} videos with trending audio`);
      return matches;
    } catch (error) {
      console.error('Error matching all pending videos:', error);
      return [];
    }
  }

  /**
   * Get video data from database
   */
  private async getVideoData(videoId: string): Promise<VideoMatchData | null> {
    try {
      // First try to get from VideoStatus
      const videoStatus = await VideoStatus.findOne({ videoId });
      if (!videoStatus) {
        return null;
      }

      // Try to get additional data from YouTubeVideo if it's a YouTube video
      if (videoStatus.platform === 'youtube') {
        const youtubeVideo = await YouTubeVideo.findOne({ videoId });
        if (youtubeVideo) {
          return {
            videoId,
            platform: videoStatus.platform,
            title: youtubeVideo.title,
            description: youtubeVideo.description,
            tags: youtubeVideo.tags || [],
            keywords: this.extractKeywords(youtubeVideo.title + ' ' + youtubeVideo.description)
          };
        }
      }

      // Fallback to basic data from VideoStatus
      return {
        videoId,
        platform: videoStatus.platform,
        title: videoStatus.filename.replace(/\.(mp4|mov|avi)$/i, ''),
        description: '',
        tags: [],
        keywords: this.extractKeywords(videoStatus.filename)
      };
    } catch (error) {
      console.error(`Error getting video data for ${videoId}:`, error);
      return null;
    }
  }

  /**
   * Get trending audio for specific platform
   */
  private async getTrendingAudioForPlatform(platform: 'youtube' | 'instagram'): Promise<TrendingAudio[]> {
    if (platform === 'youtube') {
      return await this.audioScraper.fetchYouTubeTrendingAudio();
    } else {
      return await this.audioScraper.fetchInstagramTrendingAudio();
    }
  }

  /**
   * Find the best audio match for a video
   */
  private findBestAudioMatch(video: VideoMatchData, trendingAudio: TrendingAudio[]): {
    audio: TrendingAudio;
    matchingFactors: {
      topicMatch: number;
      keywordMatch: number;
      categoryMatch: number;
      overallScore: number;
    };
  } | null {
    let bestMatch: any = null;
    let bestScore = 0;

    for (const audio of trendingAudio) {
      const matchingFactors = this.calculateMatchingScore(video, audio);
      
      if (matchingFactors.overallScore > bestScore && matchingFactors.overallScore >= 15) { // Minimum 15% match for production
        bestScore = matchingFactors.overallScore;
        bestMatch = {
          audio,
          matchingFactors
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate matching score between video and audio
   */
  private calculateMatchingScore(video: VideoMatchData, audio: TrendingAudio): {
    topicMatch: number;
    keywordMatch: number;
    categoryMatch: number;
    overallScore: number;
  } {
    // Topic matching (based on title similarity)
    const topicMatch = this.calculateTextSimilarity(video.title, audio.title);

    // Keyword matching
    const videoKeywords = [...video.keywords, ...video.tags];
    const audioKeywords = audio.keywords;
    const keywordMatch = this.calculateKeywordOverlap(videoKeywords, audioKeywords);

    // Category matching (basic implementation)
    const categoryMatch = this.calculateCategoryMatch(video, audio);

    // Overall score with weights
    const overallScore = Math.round(
      (topicMatch * 0.4) +      // 40% weight on topic match
      (keywordMatch * 0.4) +    // 40% weight on keyword match
      (categoryMatch * 0.2)     // 20% weight on category match
    );

    return {
      topicMatch: Math.round(topicMatch),
      keywordMatch: Math.round(keywordMatch),
      categoryMatch: Math.round(categoryMatch),
      overallScore
    };
  }

  /**
   * Calculate text similarity between two strings
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  /**
   * Calculate keyword overlap percentage
   */
  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const set1 = new Set(keywords1.map(k => k.toLowerCase()));
    const set2 = new Set(keywords2.map(k => k.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  /**
   * Calculate category matching score
   */
  private calculateCategoryMatch(video: VideoMatchData, audio: TrendingAudio): number {
    // Basic category matching - can be enhanced with more sophisticated logic
    const videoCategories = video.tags.map(tag => tag.toLowerCase());
    const audioCategory = audio.category?.toLowerCase() || '';
    
    // Check for real estate related content
    const realEstateKeywords = ['real estate', 'property', 'home', 'house', 'apartment', 'condo', 'mortgage', 'realtor'];
    const hasRealEstate = videoCategories.some(cat => realEstateKeywords.some(keyword => cat.includes(keyword)));
    
    if (hasRealEstate) {
      // For real estate content, prefer trending/popular audio over specific genre matches
      return audio.trending_rank <= 10 ? 90 : audio.trending_rank <= 20 ? 70 : 50; // Higher scores for trending audio
    }
    
    // Generic category matching
    if (audioCategory && videoCategories.includes(audioCategory)) {
      return 90;
    }
    
    return 40; // Base score for any trending audio
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10);
  }
} 