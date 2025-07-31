import axios from 'axios';

interface TrendingAudio {
  id: string;
  title: string;
  artist: string;
  platform: 'instagram' | 'youtube';
  trendingScore: number;
  duration: number;
  audioUrl?: string;
}

class TrendingAudioService {
  private instagramTrendingAudio: TrendingAudio[] = [
    { id: 'ig_trending_1', title: 'Motivational Beat', artist: 'BeatsProducer', platform: 'instagram', trendingScore: 95, duration: 30 },
    { id: 'ig_trending_2', title: 'Success Mindset', artist: 'AudioMaster', platform: 'instagram', trendingScore: 88, duration: 15 },
    { id: 'ig_trending_3', title: 'Morning Energy', artist: 'VibeCreator', platform: 'instagram', trendingScore: 82, duration: 20 },
    { id: 'ig_trending_4', title: 'Hustle Mode', artist: 'GrindBeats', platform: 'instagram', trendingScore: 79, duration: 25 },
    { id: 'ig_trending_5', title: 'Focus Flow', artist: 'ZenSounds', platform: 'instagram', trendingScore: 76, duration: 30 }
  ];

  private youtubeTrendingAudio: TrendingAudio[] = [
    { id: 'yt_trending_1', title: 'Viral Shorts Beat', artist: 'ShortsKing', platform: 'youtube', trendingScore: 92, duration: 60 },
    { id: 'yt_trending_2', title: 'Motivation Mix', artist: 'SuccessSound', platform: 'youtube', trendingScore: 87, duration: 45 },
    { id: 'yt_trending_3', title: 'Study Vibes', artist: 'BookBeats', platform: 'youtube', trendingScore: 84, duration: 30 },
    { id: 'yt_trending_4', title: 'Workout Energy', artist: 'GymTracks', platform: 'youtube', trendingScore: 81, duration: 40 },
    { id: 'yt_trending_5', title: 'Chill Success', artist: 'RelaxedRise', platform: 'youtube', trendingScore: 77, duration: 35 }
  ];

  /**
   * Get trending audio for a specific platform
   */
  async getTrendingAudio(platform: 'instagram' | 'youtube', limit: number = 10): Promise<TrendingAudio[]> {
    try {
      if (platform === 'instagram') {
        return await this.getInstagramTrendingAudio(limit);
      } else {
        return await this.getYouTubeTrendingAudio(limit);
      }
    } catch (error) {
      console.error(`❌ Failed to get trending audio for ${platform}:`, error);
      return this.getFallbackAudio(platform, limit);
    }
  }

  /**
   * Get a single random trending audio for a platform
   */
  async getRandomTrendingAudio(platform: 'instagram' | 'youtube'): Promise<string> {
    const trendingList = await this.getTrendingAudio(platform, 5);
    const randomAudio = trendingList[Math.floor(Math.random() * trendingList.length)];
    return randomAudio.id;
  }

  /**
   * Get Instagram trending audio (would integrate with real Instagram API)
   */
  private async getInstagramTrendingAudio(limit: number): Promise<TrendingAudio[]> {
    // TODO: Replace with actual Instagram Graph API call
    // For now, return curated trending audio with some randomization
    const shuffled = [...this.instagramTrendingAudio].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  /**
   * Get YouTube trending audio (would integrate with YouTube Data API)
   */
  private async getYouTubeTrendingAudio(limit: number): Promise<TrendingAudio[]> {
    // TODO: Replace with actual YouTube Data API call to get trending Shorts audio
    // For now, return curated trending audio with some randomization
    const shuffled = [...this.youtubeTrendingAudio].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  /**
   * Fallback audio if APIs fail
   */
  private getFallbackAudio(platform: 'instagram' | 'youtube', limit: number): TrendingAudio[] {
    const fallback = platform === 'instagram' 
      ? this.instagramTrendingAudio 
      : this.youtubeTrendingAudio;
    return fallback.slice(0, limit);
  }

  /**
   * Get audio metadata by ID
   */
  async getAudioMetadata(audioId: string): Promise<TrendingAudio | null> {
    const allAudio = [...this.instagramTrendingAudio, ...this.youtubeTrendingAudio];
    return allAudio.find(audio => audio.id === audioId) || null;
  }

  /**
   * Search for audio by keywords
   */
  async searchAudio(query: string, platform?: 'instagram' | 'youtube'): Promise<TrendingAudio[]> {
    const audioList = platform 
      ? (platform === 'instagram' ? this.instagramTrendingAudio : this.youtubeTrendingAudio)
      : [...this.instagramTrendingAudio, ...this.youtubeTrendingAudio];

    const searchTerms = query.toLowerCase().split(' ');
    
    return audioList.filter(audio => {
      const searchText = `${audio.title} ${audio.artist}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    }).sort((a, b) => b.trendingScore - a.trendingScore);
  }

  /**
   * Refresh trending audio data (would call external APIs)
   */
  async refreshTrendingData(): Promise<{ updated: number; platform: string }[]> {
    console.log('🔄 Refreshing trending audio data...');
    
    try {
      // TODO: Call actual APIs to refresh data
      // For now, just shuffle the existing data to simulate updates
      this.instagramTrendingAudio.sort(() => Math.random() - 0.5);
      this.youtubeTrendingAudio.sort(() => Math.random() - 0.5);
      
      return [
        { updated: this.instagramTrendingAudio.length, platform: 'instagram' },
        { updated: this.youtubeTrendingAudio.length, platform: 'youtube' }
      ];
    } catch (error) {
      console.error('❌ Failed to refresh trending audio data:', error);
      throw error;
    }
  }
}

export const trendingAudioService = new TrendingAudioService();