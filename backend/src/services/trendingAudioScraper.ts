import axios from 'axios';

export interface TrendingAudio {
  title: string;
  artist?: string;
  duration?: number;
  trending_rank: number;
  platform_audio_id: string;
  category?: string;
  keywords: string[];
  platform: 'youtube' | 'instagram';
}

export class TrendingAudioScraper {
  private youtubeApiKey: string;
  private instagramToken: string;

  constructor() {
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
    this.instagramToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
  }

  /**
   * Fetch trending audio from YouTube Music/Shorts
   */
  async fetchYouTubeTrendingAudio(): Promise<TrendingAudio[]> {
    try {
      if (!this.youtubeApiKey) {
        console.warn('YouTube API key not configured for trending audio');
        return [];
      }

      // YouTube Music Charts API endpoint
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          videoCategoryId: '10', // Music category
          maxResults: 50,
          regionCode: 'US',
          key: this.youtubeApiKey
        }
      });

      const trendingAudio: TrendingAudio[] = response.data.items.map((item: any, index: number) => ({
        title: item.snippet.title,
        artist: this.extractArtistFromTitle(item.snippet.title),
        duration: this.parseDuration(item.contentDetails?.duration),
        trending_rank: index + 1,
        platform_audio_id: item.id,
        category: item.snippet.categoryId,
        keywords: this.extractKeywords(item.snippet.title + ' ' + item.snippet.description),
        platform: 'youtube' as const
      }));

      return trendingAudio;
    } catch (error) {
      console.error('Error fetching YouTube trending audio:', error);
      return [];
    }
  }

  /**
   * Fetch trending audio from Instagram Reels
   */
  async fetchInstagramTrendingAudio(): Promise<TrendingAudio[]> {
    try {
      if (!this.instagramToken) {
        console.warn('Instagram access token not configured for trending audio');
        return [];
      }

      // Instagram Graph API for trending audio tracks
      const response = await axios.get(`https://graph.instagram.com/v18.0/ig_hashtag_search`, {
        params: {
          user_id: process.env.INSTAGRAM_USER_ID,
          q: 'trending,music,audio',
          access_token: this.instagramToken
        }
      });

      // Note: Instagram's API is more limited for trending audio
      // This is a simplified implementation - in production you might use third-party services
      const trendingAudio: TrendingAudio[] = response.data.data?.slice(0, 20).map((item: any, index: number) => ({
        title: item.name || 'Trending Audio',
        artist: 'Unknown',
        duration: 30, // Default for Instagram Reels
        trending_rank: index + 1,
        platform_audio_id: item.id,
        category: 'reels',
        keywords: [item.name?.toLowerCase() || 'trending'],
        platform: 'instagram' as const
      })) || [];

      return trendingAudio;
    } catch (error) {
      console.error('Error fetching Instagram trending audio:', error);
      return [];
    }
  }

  /**
   * Get all trending audio from both platforms
   */
  async getAllTrendingAudio(): Promise<TrendingAudio[]> {
    const [youtubeAudio, instagramAudio] = await Promise.all([
      this.fetchYouTubeTrendingAudio(),
      this.fetchInstagramTrendingAudio()
    ]);

    return [...youtubeAudio, ...instagramAudio];
  }

  /**
   * Extract artist name from YouTube title (basic implementation)
   */
  private extractArtistFromTitle(title: string): string {
    // Common patterns: "Artist - Song", "Song by Artist", "Artist: Song"
    const patterns = [
      /^([^-]+)\s*-\s*.+/,
      /.+\s+by\s+([^|]+)/i,
      /^([^:]+):\s*.+/
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'Unknown Artist';
  }

  /**
   * Parse YouTube duration format (PT4M13S)
   */
  private parseDuration(duration?: string): number | undefined {
    if (!duration) return undefined;
    
    const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return undefined;
    
    const minutes = parseInt(match[1] || '0');
    const seconds = parseInt(match[2] || '0');
    return minutes * 60 + seconds;
  }

  /**
   * Extract keywords from text for matching
   */
  private extractKeywords(text: string): string[] {
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }
} 