import axios from 'axios';
import { logger } from '../utils/logger';
import { MusicRecommendationsModel } from '../models/MusicRecommendation';


export interface TrendingTrack {
  id: string;
  name: string;
  artist: string;
  album?: string;
  genre: string;
  mood: string;
  tempo: number;
  energy: number;
  danceability: number;
  valence: number;
  popularity: number;
  trendingScore: number;
  platform: 'spotify' | 'tiktok' | 'youtube' | 'soundcloud' | 'custom';
  previewUrl?: string;
  externalUrl?: string;
  duration: number;
  isExplicit: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MusicRecommendation {
  track: TrendingTrack;
  matchScore: number;
  matchReason: string;
  videoMood: string;
  contentType: 'real_estate' | 'cartoon';
  platformOptimized: string[];
}

export interface MusicMatchRequest {
  videoId: string;
  videoMood: string;
  contentType: 'real_estate' | 'cartoon';
  audioDuration: number;
  audioTempo?: number;
  audioEnergy?: number;
  targetPlatforms: string[];
  preferredGenres?: string[];
  excludeExplicit?: boolean;
}

export interface TrendingMusicResponse {
  tracks: TrendingTrack[];
  totalCount: number;
  lastUpdated: Date;
  sources: string[];
  nextUpdate: Date;
}

export class TrendingMusicService {
  private readonly SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  private readonly SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  private readonly TIKTOK_API_KEY = process.env.TIKTOK_API_KEY;
  private readonly YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  // private readonly SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;

  private spotifyAccessToken: string | null = null;
  private spotifyTokenExpiry: Date | null = null;

  /**
   * Get trending music recommendations for a video
   */
  async getMusicRecommendations(request: MusicMatchRequest): Promise<MusicRecommendation[]> {
    try {
      logger.info(`Getting music recommendations for video: ${request.videoId}`);

      // Get trending tracks from all platforms
      const trendingTracks = await this.getAllTrendingTracks();

      // Filter tracks based on request criteria
      const filteredTracks = this.filterTracks(trendingTracks, request);

      // Calculate match scores
      const recommendations = filteredTracks.map(track => ({
        track,
        matchScore: this.calculateMatchScore(track, request),
        matchReason: this.generateMatchReason(track, request),
        videoMood: request.videoMood,
        contentType: request.contentType,
        platformOptimized: this.getPlatformOptimization(track, request.targetPlatforms)
      }));

      // Sort by match score and return top recommendations
      const sortedRecommendations = recommendations
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 15);

      // Store recommendations for analytics
      await this.storeMusicRecommendations(request.videoId, sortedRecommendations);

      logger.info(`Generated ${sortedRecommendations.length} music recommendations for video: ${request.videoId}`);
      return sortedRecommendations;

    } catch (error) {
      logger.error(`Error getting music recommendations for video ${request.videoId}:`, error);
      return this.getFallbackRecommendations(request);
    }
  }

  /**
   * Get all trending tracks from multiple platforms
   */
  private async getAllTrendingTracks(): Promise<TrendingTrack[]> {
    try {
      // Run all platform fetches in parallel
      const [spotifyTracks, tiktokTracks, youtubeTracks, customTracks] = await Promise.all([
        this.getSpotifyTrendingTracks(),
        this.getTikTokTrendingTracks(),
        this.getYouTubeTrendingTracks(),
        this.getCustomTrendingTracks()
      ]);

      // Combine all tracks
      const allTracks = [...spotifyTracks, ...tiktokTracks, ...youtubeTracks, ...customTracks];

      // Remove duplicates and sort by trending score
      const uniqueTracks = this.removeDuplicateTracks(allTracks);
      const sortedTracks = uniqueTracks.sort((a, b) => b.trendingScore - a.trendingScore);

      logger.info(`Fetched ${sortedTracks.length} trending tracks from all platforms`);
      return sortedTracks;

    } catch (error) {
      logger.error('Error fetching trending tracks:', error);
      return this.getFallbackTracks();
    }
  }

  /**
   * Get trending tracks from Spotify
   */
  private async getSpotifyTrendingTracks(): Promise<TrendingTrack[]> {
    try {
      if (!this.SPOTIFY_CLIENT_ID || !this.SPOTIFY_CLIENT_SECRET) {
        logger.warn('Spotify credentials not configured');
        return [];
      }

      // Get access token
      const accessToken = await this.getSpotifyAccessToken();
      if (!accessToken) {
        return [];
      }

      // Get trending playlists
      const playlistsResponse = await axios.get('https://api.spotify.com/v1/browse/featured-playlists', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: { limit: 10, country: 'US' }
      });

      const tracks: TrendingTrack[] = [];

      // Get tracks from each playlist
      for (const playlist of playlistsResponse.data.playlists.items.slice(0, 3)) {
        const tracksResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          params: { limit: 20 }
        });

        for (const item of tracksResponse.data.items) {
          if (item.track && item.track.preview_url) {
            // Get audio features
            const audioFeatures = await this.getSpotifyAudioFeatures(item.track.id, accessToken);
            
            tracks.push({
              id: `spotify_${item.track.id}`,
              name: item.track.name,
              artist: item.track.artists[0].name,
              album: item.track.album.name,
              genre: this.inferGenreFromSpotifyTrack(item.track),
              mood: this.inferMoodFromAudioFeatures(audioFeatures),
              tempo: audioFeatures?.tempo || 120,
              energy: audioFeatures?.energy || 0.5,
              danceability: audioFeatures?.danceability || 0.5,
              valence: audioFeatures?.valence || 0.5,
              popularity: item.track.popularity,
              trendingScore: this.calculateSpotifyTrendingScore(item.track, playlist),
              platform: 'spotify',
              previewUrl: item.track.preview_url,
              externalUrl: item.track.external_urls.spotify,
              duration: item.track.duration_ms,
              isExplicit: item.track.explicit,
              tags: this.generateSpotifyTags(item.track, audioFeatures),
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }

      logger.info(`Fetched ${tracks.length} trending tracks from Spotify`);
      return tracks;

    } catch (error) {
      logger.error('Error fetching Spotify trending tracks:', error);
      return [];
    }
  }

  /**
   * Get trending tracks from TikTok
   */
  private async getTikTokTrendingTracks(): Promise<TrendingTrack[]> {
    try {
      if (!this.TIKTOK_API_KEY) {
        logger.warn('TikTok API key not configured');
        return [];
      }

      // TikTok trending music API integration would go here
      // For now, returning mock trending tracks
      const mockTracks: TrendingTrack[] = [
        {
          id: 'tiktok_trending_1',
          name: 'Viral Beat 2024',
          artist: 'TikTok Artist',
          genre: 'electronic',
          mood: 'energetic',
          tempo: 128,
          energy: 0.9,
          danceability: 0.8,
          valence: 0.7,
          popularity: 95,
          trendingScore: 0.95,
          platform: 'tiktok',
          duration: 15000,
          isExplicit: false,
          tags: ['viral', 'trending', 'dance', 'electronic'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'tiktok_trending_2',
          name: 'Real Estate Vibes',
          artist: 'Property Music',
          genre: 'ambient',
          mood: 'professional',
          tempo: 90,
          energy: 0.6,
          danceability: 0.4,
          valence: 0.8,
          popularity: 85,
          trendingScore: 0.85,
          platform: 'tiktok',
          duration: 30000,
          isExplicit: false,
          tags: ['real-estate', 'professional', 'ambient', 'property'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      logger.info(`Fetched ${mockTracks.length} trending tracks from TikTok`);
      return mockTracks;

    } catch (error) {
      logger.error('Error fetching TikTok trending tracks:', error);
      return [];
    }
  }

  /**
   * Get trending tracks from YouTube
   */
  private async getYouTubeTrendingTracks(): Promise<TrendingTrack[]> {
    try {
      if (!this.YOUTUBE_API_KEY) {
        logger.warn('YouTube API key not configured');
        return [];
      }

      // YouTube trending music API integration would go here
      // For now, returning mock trending tracks
      const mockTracks: TrendingTrack[] = [
        {
          id: 'youtube_trending_1',
          name: 'YouTube Trending Beat',
          artist: 'YouTube Artist',
          genre: 'pop',
          mood: 'upbeat',
          tempo: 120,
          energy: 0.8,
          danceability: 0.7,
          valence: 0.9,
          popularity: 90,
          trendingScore: 0.9,
          platform: 'youtube',
          duration: 180000,
          isExplicit: false,
          tags: ['trending', 'pop', 'upbeat', 'youtube'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      logger.info(`Fetched ${mockTracks.length} trending tracks from YouTube`);
      return mockTracks;

    } catch (error) {
      logger.error('Error fetching YouTube trending tracks:', error);
      return [];
    }
  }

  /**
   * Get custom trending tracks for real estate
   */
  private async getCustomTrendingTracks(): Promise<TrendingTrack[]> {
    const customTracks: TrendingTrack[] = [
      {
        id: 'custom_real_estate_1',
        name: 'Property Showcase',
        artist: 'Real Estate Music',
        genre: 'ambient',
        mood: 'professional',
        tempo: 85,
        energy: 0.6,
        danceability: 0.3,
        valence: 0.8,
        popularity: 80,
        trendingScore: 0.8,
        platform: 'custom',
        duration: 60000,
        isExplicit: false,
        tags: ['real-estate', 'professional', 'showcase', 'ambient'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'custom_real_estate_2',
        name: 'Luxury Living',
        artist: 'Property Sounds',
        genre: 'cinematic',
        mood: 'inspiring',
        tempo: 95,
        energy: 0.7,
        danceability: 0.4,
        valence: 0.9,
        popularity: 85,
        trendingScore: 0.85,
        platform: 'custom',
        duration: 45000,
        isExplicit: false,
        tags: ['luxury', 'inspiring', 'cinematic', 'real-estate'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'custom_cartoon_1',
        name: 'Animated Fun',
        artist: 'Cartoon Music',
        genre: 'playful',
        mood: 'cheerful',
        tempo: 110,
        energy: 0.8,
        danceability: 0.6,
        valence: 0.95,
        popularity: 75,
        trendingScore: 0.75,
        platform: 'custom',
        duration: 30000,
        isExplicit: false,
        tags: ['cartoon', 'playful', 'cheerful', 'animated'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    logger.info(`Loaded ${customTracks.length} custom trending tracks`);
    return customTracks;
  }

  /**
   * Get Spotify access token
   */
  private async getSpotifyAccessToken(): Promise<string | null> {
    try {
      // Check if current token is still valid
      if (this.spotifyAccessToken && this.spotifyTokenExpiry && new Date() < this.spotifyTokenExpiry) {
        return this.spotifyAccessToken;
      }

      // Get new token
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.SPOTIFY_CLIENT_ID}:${this.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.spotifyAccessToken = response.data.access_token;
      this.spotifyTokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      return this.spotifyAccessToken;

    } catch (error) {
      logger.error('Error getting Spotify access token:', error);
      return null;
    }
  }

  /**
   * Get audio features for Spotify track
   */
  private async getSpotifyAudioFeatures(trackId: string, accessToken: string): Promise<any> {
    try {
      const response = await axios.get(`https://api.spotify.com/v1/audio-features/${trackId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error getting audio features for track ${trackId}:`, error);
      return null;
    }
  }

  /**
   * Filter tracks based on request criteria
   */
  private filterTracks(tracks: TrendingTrack[], request: MusicMatchRequest): TrendingTrack[] {
    return tracks.filter(track => {
      // Filter by explicit content
      if (request.excludeExplicit && track.isExplicit) {
        return false;
      }

      // Filter by duration (should be reasonable length)
      if (track.duration < 10000 || track.duration > 300000) {
        return false;
      }

      // Filter by preferred genres
      if (request.preferredGenres && request.preferredGenres.length > 0) {
        if (!request.preferredGenres.includes(track.genre)) {
          return false;
        }
      }

      // Filter by content type relevance
      if (request.contentType === 'real_estate') {
        // Prefer professional, ambient, cinematic music for real estate
        const realEstateGenres = ['ambient', 'cinematic', 'classical', 'electronic', 'instrumental'];
        if (!realEstateGenres.includes(track.genre) && !track.tags.includes('real-estate')) {
          // Lower threshold for real estate content
          return track.popularity > 70;
        }
      } else if (request.contentType === 'cartoon') {
        // Prefer upbeat, playful music for cartoon content
        const cartoonGenres = ['pop', 'electronic', 'playful', 'upbeat'];
        if (!cartoonGenres.includes(track.genre) && !track.tags.includes('cartoon')) {
          return track.energy > 0.6;
        }
      }

      return true;
    });
  }

  /**
   * Calculate match score between track and video
   */
  private calculateMatchScore(track: TrendingTrack, request: MusicMatchRequest): number {
    let score = 0;

    // Base trending score (40% weight)
    score += track.trendingScore * 0.4;

    // Mood matching (20% weight)
    const moodMatch = this.calculateMoodMatch(track.mood, request.videoMood);
    score += moodMatch * 0.2;

    // Content type matching (15% weight)
    const contentMatch = this.calculateContentMatch(track, request.contentType);
    score += contentMatch * 0.15;

    // Audio characteristics matching (15% weight)
    const audioMatch = this.calculateAudioMatch(track, request);
    score += audioMatch * 0.15;

    // Platform optimization (10% weight)
    const platformMatch = this.calculatePlatformMatch(track, request.targetPlatforms);
    score += platformMatch * 0.1;

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Calculate mood matching score
   */
  private calculateMoodMatch(trackMood: string, videoMood: string): number {
    const moodCompatibility: Record<string, string[]> = {
      'energetic': ['upbeat', 'exciting', 'dynamic', 'powerful'],
      'calm': ['peaceful', 'relaxing', 'ambient', 'professional'],
      'professional': ['corporate', 'clean', 'sophisticated', 'calm'],
      'upbeat': ['energetic', 'happy', 'positive', 'cheerful'],
      'dramatic': ['cinematic', 'intense', 'powerful', 'emotional'],
      'cheerful': ['happy', 'upbeat', 'positive', 'playful'],
      'inspiring': ['uplifting', 'motivational', 'positive', 'emotional']
    };

    if (trackMood === videoMood) {
      return 1.0;
    }

    const compatibleMoods = moodCompatibility[videoMood] || [];
    if (compatibleMoods.includes(trackMood)) {
      return 0.7;
    }

    return 0.3;
  }

  /**
   * Calculate content type matching score
   */
  private calculateContentMatch(track: TrendingTrack, contentType: string): number {
    if (contentType === 'real_estate') {
      // Real estate content prefers professional, ambient music
      if (track.tags.includes('real-estate') || track.tags.includes('professional')) {
        return 1.0;
      }
      if (['ambient', 'cinematic', 'classical', 'instrumental'].includes(track.genre)) {
        return 0.8;
      }
      if (track.energy < 0.7 && track.valence > 0.5) {
        return 0.6;
      }
    } else if (contentType === 'cartoon') {
      // Cartoon content prefers upbeat, playful music
      if (track.tags.includes('cartoon') || track.tags.includes('playful')) {
        return 1.0;
      }
      if (['pop', 'electronic', 'playful', 'upbeat'].includes(track.genre)) {
        return 0.8;
      }
      if (track.energy > 0.6 && track.valence > 0.7) {
        return 0.7;
      }
    }

    return 0.5;
  }

  /**
   * Calculate audio characteristics matching score
   */
  private calculateAudioMatch(track: TrendingTrack, request: MusicMatchRequest): number {
    let score = 0;

    // Tempo matching
    if (request.audioTempo) {
      const tempoDiff = Math.abs(track.tempo - request.audioTempo);
      if (tempoDiff < 10) {
        score += 0.5;
      } else if (tempoDiff < 30) {
        score += 0.3;
      } else {
        score += 0.1;
      }
    } else {
      score += 0.3; // Default if no tempo specified
    }

    // Energy matching
    if (request.audioEnergy) {
      const energyDiff = Math.abs(track.energy - request.audioEnergy);
      if (energyDiff < 0.2) {
        score += 0.5;
      } else if (energyDiff < 0.4) {
        score += 0.3;
      } else {
        score += 0.1;
      }
    } else {
      score += 0.3; // Default if no energy specified
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate platform optimization score
   */
  private calculatePlatformMatch(track: TrendingTrack, targetPlatforms: string[]): number {
    if (targetPlatforms.includes(track.platform)) {
      return 1.0;
    }

    // Platform-specific preferences
    const platformPreferences: Record<string, string[]> = {
      'instagram': ['pop', 'electronic', 'ambient', 'cinematic'],
      'tiktok': ['electronic', 'pop', 'upbeat', 'viral'],
      'youtube': ['cinematic', 'ambient', 'pop', 'electronic']
    };

    let score = 0;
    for (const platform of targetPlatforms) {
      const preferences = platformPreferences[platform] || [];
      if (preferences.includes(track.genre)) {
        score += 0.3;
      }
    }

    return Math.min(score, 1);
  }

  /**
   * Generate match reasoning
   */
  private generateMatchReason(track: TrendingTrack, request: MusicMatchRequest): string {
    const reasons = [];

    if (track.trendingScore > 0.8) {
      reasons.push('highly trending');
    }

    if (track.mood === request.videoMood) {
      reasons.push(`perfect mood match (${track.mood})`);
    }

    if (request.contentType === 'real_estate' && track.tags.includes('real-estate')) {
      reasons.push('real estate optimized');
    }

    if (request.contentType === 'cartoon' && track.tags.includes('cartoon')) {
      reasons.push('cartoon optimized');
    }

    if (track.popularity > 85) {
      reasons.push('high popularity');
    }

    if (request.targetPlatforms.includes(track.platform)) {
      reasons.push(`${track.platform} native`);
    }

    return reasons.length > 0 ? reasons.join(', ') : 'good overall match';
  }

  /**
   * Get platform optimization info
   */
  private getPlatformOptimization(track: TrendingTrack, targetPlatforms: string[]): string[] {
    const optimized = [];

    for (const platform of targetPlatforms) {
      if (platform === 'instagram' && ['ambient', 'cinematic', 'pop'].includes(track.genre)) {
        optimized.push('instagram');
      }
      if (platform === 'tiktok' && ['electronic', 'pop', 'upbeat'].includes(track.genre)) {
        optimized.push('tiktok');
      }
      if (platform === 'youtube' && ['cinematic', 'ambient'].includes(track.genre)) {
        optimized.push('youtube');
      }
    }

    return optimized;
  }

  private async storeMusicRecommendations(userId: string, recommendations: MusicRecommendation[]): Promise<void> {
    try {
      // Store music recommendations in database
      logger.info(`Storing ${recommendations.length} music recommendations for user ${userId}`);
      
      // Store each recommendation in the database
      for (const rec of recommendations) {
        try {
          await MusicRecommendationsModel.create({
            userId,
            videoId: rec.track.id, // Using track ID as video reference for now
            trackId: rec.track.id,
            trackName: rec.track.name,
            artistName: rec.track.artist,
            album: rec.track.album,
            genre: rec.track.genre,
            mood: rec.track.mood,
            tempo: rec.track.tempo,
            energy: rec.track.energy,
            danceability: rec.track.danceability,
            valence: rec.track.valence,
            popularity: rec.track.popularity,
            trendingScore: rec.track.trendingScore,
            platform: rec.track.platform,
            previewUrl: rec.track.previewUrl,
            externalUrl: rec.track.externalUrl,
            duration: rec.track.duration,
            isExplicit: rec.track.isExplicit,
            tags: rec.track.tags,
            matchData: {
              matchScore: rec.matchScore,
              matchReason: rec.matchReason,
              videoMood: rec.videoMood,
              contentType: rec.contentType,
              platformOptimized: rec.platformOptimized,
              audioDuration: 120, // Default duration
              audioTempo: rec.track.tempo,
              audioEnergy: rec.track.energy
            },
            recommendationSource: 'ai_analysis',
            isUsed: false
          });
        } catch (error) {
          logger.error(`Failed to store recommendation for track ${rec.track.name}:`, error);
          // Continue with other recommendations
        }
      }
      
    } catch (error) {
      logger.warn('Could not store music recommendations:', error);
      // Don't fail the request if storage fails
    }
  }

  private async getCachedRecommendations(userId: string): Promise<MusicRecommendation[]> {
    try {
      // For now, return empty array (no cached recommendations available)
      // In production, this would query the MusicRecommendations collection
      logger.debug(`Checking for cached music recommendations for user ${userId}`);
      
      // Future: Query MusicRecommendations collection
      // const cached = await MusicRecommendationsModel.findOne({
      //   userId,
      //   createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
      // }).lean();
      // 
      // if (cached && cached.recommendations) {
      //   logger.info(`Found ${cached.recommendations.length} cached recommendations for user ${userId}`);
      //   return cached.recommendations;
      // }
      
      return [];
      
    } catch (error) {
      logger.error('Error checking cached music recommendations:', error);
      return [];
    }
  }

  /**
   * Get stored music recommendations for video
   */
  async getStoredRecommendations(videoId: string): Promise<MusicRecommendation[]> {
    try {
      // Query stored recommendations from database
      logger.info(`Retrieving music recommendations for video ${videoId}`);
      
      // Check for cached recommendations first
      const cached = await MusicRecommendationsModel.findOne({
        videoId,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      if (cached) {
        logger.info(`Found cached music recommendation for video ${videoId}`);
        return [{
          track: {
            id: cached.trackId,
            name: cached.trackName,
            artist: cached.artistName,
            album: cached.album,
            genre: cached.genre,
            mood: cached.mood,
            tempo: cached.tempo,
            energy: cached.energy,
            danceability: cached.danceability,
            valence: cached.valence,
            popularity: cached.popularity,
            trendingScore: cached.trendingScore,
            platform: cached.platform,
            previewUrl: cached.previewUrl,
            externalUrl: cached.externalUrl,
            duration: cached.duration,
            isExplicit: cached.isExplicit,
            tags: cached.tags,
            createdAt: cached.createdAt,
            updatedAt: cached.updatedAt
          },
          matchScore: cached.matchData.matchScore,
          matchReason: cached.matchData.matchReason,
          videoMood: cached.matchData.videoMood,
          contentType: cached.matchData.contentType,
          platformOptimized: cached.matchData.platformOptimized
        }];
      }

      const storedRecs = await MusicRecommendationsModel.find({
        videoId,
        expiresAt: { $gt: new Date() }, // Only active recommendations
        isUsed: false
      })
      .sort({ 'matchData.matchScore': -1 })
      .limit(10);

      if (storedRecs.length > 0) {
        // Convert stored recommendations to MusicRecommendation format
        return storedRecs.map(rec => ({
          track: {
            id: rec.trackId,
            name: rec.trackName,
            artist: rec.artistName,
            album: rec.album,
            genre: rec.genre,
            mood: rec.mood,
            tempo: rec.tempo,
            energy: rec.energy,
            danceability: rec.danceability,
            valence: rec.valence,
            popularity: rec.popularity,
            trendingScore: rec.trendingScore,
            platform: rec.platform,
            previewUrl: rec.previewUrl,
            externalUrl: rec.externalUrl,
            duration: rec.duration,
            isExplicit: rec.isExplicit,
            tags: rec.tags,
            createdAt: rec.createdAt,
            updatedAt: rec.updatedAt
          },
          matchScore: rec.matchData.matchScore,
          matchReason: rec.matchData.matchReason,
          videoMood: rec.matchData.videoMood,
          contentType: rec.matchData.contentType,
          platformOptimized: rec.matchData.platformOptimized
        }));
      }

      // Fallback to generic recommendations if no stored data
      return [
        {
          track: {
            id: 'trending-1',
            name: 'Upbeat Corporate',
            artist: 'Audio Library',
            genre: 'Corporate',
            mood: 'upbeat',
            tempo: 120,
            energy: 0.8,
            danceability: 0.6,
            valence: 0.8,
            popularity: 75,
            trendingScore: 85,
            platform: 'custom' as const,
            duration: 120,
            isExplicit: false,
            tags: ['corporate', 'upbeat', 'background'],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          matchScore: 0.9,
          matchReason: 'High energy match for professional content',
          videoMood: 'professional',
          contentType: 'real_estate' as const,
          platformOptimized: ['instagram', 'youtube']
        }
      ];
    } catch (error) {
      logger.error('Error getting stored recommendations:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */
  private removeDuplicateTracks(tracks: TrendingTrack[]): TrendingTrack[] {
    const seen = new Set();
    return tracks.filter(track => {
      const key = `${track.name.toLowerCase()}_${track.artist.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private inferGenreFromSpotifyTrack(track: any): string {
    // Simplified genre inference
    if (track.album?.genres?.length > 0) {
      return track.album.genres[0];
    }
    return 'pop';
  }

  private inferMoodFromAudioFeatures(audioFeatures: any): string {
    if (!audioFeatures) return 'neutral';
    
    if (audioFeatures.energy > 0.7 && audioFeatures.valence > 0.7) {
      return 'energetic';
    } else if (audioFeatures.energy < 0.4 && audioFeatures.valence > 0.6) {
      return 'calm';
    } else if (audioFeatures.valence > 0.8) {
      return 'cheerful';
    } else if (audioFeatures.energy > 0.6) {
      return 'upbeat';
    } else {
      return 'professional';
    }
  }

  private calculateSpotifyTrendingScore(track: any, playlist: any): number {
    let score = track.popularity / 100;
    
    // Boost score for featured playlists
    if (playlist.name.toLowerCase().includes('trending')) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  private generateSpotifyTags(track: any, audioFeatures: any): string[] {
    const tags = [];
    
    if (audioFeatures?.energy > 0.7) tags.push('energetic');
    if (audioFeatures?.danceability > 0.7) tags.push('danceable');
    if (audioFeatures?.valence > 0.7) tags.push('positive');
    if (track.popularity > 80) tags.push('popular');
    
    return tags;
  }

  private getFallbackRecommendations(request: MusicMatchRequest): MusicRecommendation[] {
    const fallbackTracks = this.getFallbackTracks();
    
    return fallbackTracks.map(track => ({
      track,
      matchScore: 0.6,
      matchReason: 'Fallback recommendation',
      videoMood: request.videoMood,
      contentType: request.contentType,
      platformOptimized: request.targetPlatforms
    }));
  }

  private getFallbackTracks(): TrendingTrack[] {
    return [
      {
        id: 'fallback_1',
        name: 'Default Real Estate Track',
        artist: 'Default Artist',
        genre: 'ambient',
        mood: 'professional',
        tempo: 90,
        energy: 0.6,
        danceability: 0.3,
        valence: 0.7,
        popularity: 70,
        trendingScore: 0.7,
        platform: 'custom',
        duration: 60000,
        isExplicit: false,
        tags: ['real-estate', 'fallback'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}

export const trendingMusicService = new TrendingMusicService();
export default TrendingMusicService; 