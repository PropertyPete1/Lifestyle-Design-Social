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
    this.youtubeApiKey = process.env.youtubeApiKey || process.env.YOUTUBE_API_KEY || '';
    this.instagramToken = process.env.instagramAccessToken || process.env.INSTAGRAM_ACCESS_TOKEN || '';
    
    console.log('🔑 TrendingAudioScraper initialized:');
    console.log('  YouTube API Key:', this.youtubeApiKey ? `${this.youtubeApiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('  Instagram Token:', this.instagramToken ? `${this.instagramToken.substring(0, 10)}...` : 'NOT SET');
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

      console.log('🎵 Fetching YouTube trending audio...');

      // First, get trending music videos
      const videosResponse = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          chart: 'mostPopular',
          videoCategoryId: '10', // Music category
          maxResults: 30,
          regionCode: 'US',
          key: this.youtubeApiKey
        }
      });

      if (!videosResponse.data.items?.length) {
        // Fallback: Search for trending music
        const searchResponse = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
          params: {
            part: 'snippet',
            type: 'video',
            videoCategoryId: '10',
            order: 'viewCount',
            publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            maxResults: 25,
            q: 'trending music audio 2024 popular songs',
            key: this.youtubeApiKey
          }
        });

        const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',');
        
        const detailsResponse = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
          params: {
            part: 'snippet,contentDetails,statistics',
            id: videoIds,
            key: this.youtubeApiKey
          }
        });

        videosResponse.data.items = detailsResponse.data.items;
      }

      const trendingAudio: TrendingAudio[] = videosResponse.data.items.map((item: any, index: number) => ({
        title: this.cleanTitle(item.snippet.title),
        artist: this.extractArtistFromTitle(item.snippet.title) || item.snippet.channelTitle,
        duration: this.parseDuration(item.contentDetails?.duration) || 180,
        trending_rank: index + 1,
        platform_audio_id: item.id,
        category: 'Music',
        keywords: this.extractKeywords(item.snippet.title + ' ' + (item.snippet.description || '')),
        platform: 'youtube' as const
      }));

      console.log(`✅ Fetched ${trendingAudio.length} YouTube trending audio tracks`);
      return trendingAudio;
    } catch (error) {
      console.error('❌ Error fetching YouTube trending audio:', error);
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

      console.log('📸 Fetching Instagram trending audio...');

      // Get recent media with audio hashtags
      const businessId = process.env.INSTAGRAM_BUSINESS_ID;
      if (!businessId) {
        console.warn('Instagram Business ID not configured');
        return [];
      }

      // Search for trending audio-related hashtags
      const audioHashtags = ['music', 'trending', 'viral', 'audio', 'sound'];
      const allTrendingAudio: TrendingAudio[] = [];

      for (const hashtag of audioHashtags) {
        try {
          // Search hashtag
          const hashtagSearchResponse = await axios.get(`https://graph.instagram.com/v18.0/ig_hashtag_search`, {
            params: {
              user_id: businessId,
              q: hashtag,
              access_token: this.instagramToken
            }
          });

          if (hashtagSearchResponse.data.data?.length > 0) {
            const hashtagId = hashtagSearchResponse.data.data[0].id;
            
            // Get recent media for this hashtag
            const mediaResponse = await axios.get(`https://graph.instagram.com/v18.0/${hashtagId}/recent_media`, {
              params: {
                user_id: businessId,
                fields: 'id,media_type,media_url,permalink,timestamp,caption',
                limit: 10,
                access_token: this.instagramToken
              }
            });

            if (mediaResponse.data.data) {
              const hashtagMedia = mediaResponse.data.data
                .filter((item: any) => item.media_type === 'VIDEO')
                .slice(0, 5)
                .map((item: any, index: number) => ({
                  title: this.extractTitleFromCaption(item.caption) || `Trending ${hashtag} Audio`,
                  artist: 'Instagram Creator',
                  duration: 30, // Instagram Reels are typically 15-30 seconds
                  trending_rank: allTrendingAudio.length + index + 1,
                  platform_audio_id: item.id,
                  category: 'reels',
                  keywords: [hashtag, 'trending', 'viral'].concat(this.extractKeywords(item.caption || '')),
                  platform: 'instagram' as const
                }));

              allTrendingAudio.push(...hashtagMedia);
            }
          }
        } catch (hashtagError) {
          console.warn(`Failed to fetch trending audio for hashtag ${hashtag}:`, hashtagError);
        }
      }

      // Limit to top 20 and ensure unique tracks
      const uniqueAudio = allTrendingAudio
        .filter((audio, index, arr) => 
          arr.findIndex(a => a.platform_audio_id === audio.platform_audio_id) === index
        )
        .slice(0, 20);

      console.log(`✅ Fetched ${uniqueAudio.length} Instagram trending audio tracks`);
      return uniqueAudio;
    } catch (error) {
      console.error('❌ Error fetching Instagram trending audio:', error);
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
    if (!text) return [];
    
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  /**
   * Clean video title for better display
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/[\[\](){}]/g, '') // Remove brackets
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/^\s+|\s+$/g, '') // Trim
      .substring(0, 100); // Limit length
  }

  /**
   * Extract title from Instagram caption
   */
  private extractTitleFromCaption(caption: string): string | null {
    if (!caption) return null;
    
    // Get first line or sentence
    const firstLine = caption.split('\n')[0];
    const firstSentence = firstLine.split('.')[0];
    
    // Clean and limit
    const cleaned = firstSentence
      .replace(/[#@]/g, '') // Remove hashtags and mentions
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 60);
    
    return cleaned.length > 5 ? cleaned : null;
  }
} 