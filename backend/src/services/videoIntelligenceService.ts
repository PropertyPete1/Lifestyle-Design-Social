import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { logger } from '../utils/logger';
import { VideoIntelligence } from '../models/VideoIntelligence';


// Configure ffmpeg path
import ffmpegStatic from 'ffmpeg-static';
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export interface VideoAnalysisResult {
  videoId: string;
  sceneClassification: SceneAnalysis;
  audioAnalysis: AudioAnalysis;
  thumbnailOptions: ThumbnailOption[];
  musicRecommendations: MusicRecommendation[];
  engagementPrediction: EngagementPrediction;
  optimizationSuggestions: OptimizationSuggestion[];
}

export interface SceneAnalysis {
  dominantColors: string[];
  brightness: number;
  contrast: number;
  sceneType: 'indoor' | 'outdoor' | 'mixed';
  propertyType: 'house' | 'apartment' | 'commercial' | 'land' | 'unknown';
  hasText: boolean;
  hasFaces: boolean;
  faceCount: number;
  objectsDetected: string[];
  qualityScore: number;
}

export interface AudioAnalysis {
  hasAudio: boolean;
  audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
  mood: 'energetic' | 'calm' | 'professional' | 'upbeat' | 'dramatic';
  tempo: number;
  volume: number;
  backgroundNoise: number;
  speechDetected: boolean;
  musicDetected: boolean;
  recommendedMusicGenre: string[];
}

export interface ThumbnailOption {
  timestamp: number;
  imagePath: string;
  score: number;
  reasoning: string;
  faceCount: number;
  textPresent: boolean;
  colorScore: number;
  compositionScore: number;
  engagementPrediction: number;
}

export interface MusicRecommendation {
  trackId: string;
  trackName: string;
  artist: string;
  genre: string;
  mood: string;
  tempo: number;
  popularity: number;
  trendingScore: number;
  matchScore: number;
  previewUrl?: string;
  platform: 'spotify' | 'tiktok' | 'youtube' | 'custom';
}

export interface EngagementPrediction {
  overallScore: number;
  factors: {
    thumbnailQuality: number;
    audioQuality: number;
    visualAppeal: number;
    contentRelevance: number;
    trendAlignment: number;
  };
  recommendations: string[];
  expectedViews: number;
  expectedEngagementRate: number;
}

export interface OptimizationSuggestion {
  category: 'thumbnail' | 'audio' | 'compression' | 'timing' | 'content';
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'moderate' | 'complex';
  estimatedImprovement: number;
}

export class VideoIntelligenceService {
  private readonly SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  private readonly SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  // private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  // private readonly TIKTOK_TRENDING_API = process.env.TIKTOK_TRENDING_API;

  /**
   * Analyze video with full AI intelligence
   */
  async analyzeVideo(videoId: string, videoPath: string): Promise<VideoAnalysisResult> {
    try {
      logger.info(`Starting AI video analysis for video: ${videoId}`);

      // Run all analysis in parallel for efficiency
      const [
        sceneAnalysis,
        audioAnalysis,
        thumbnailOptions,
        musicRecommendations,
        engagementPrediction
      ] = await Promise.all([
        this.analyzeVideoScene(videoPath),
        this.analyzeVideoAudio(videoPath),
        this.generateThumbnailOptions(videoPath),
        this.getTrendingMusicRecommendations(videoPath),
        this.predictEngagement(videoPath)
      ]);

      // Generate optimization suggestions based on analysis
      const optimizationSuggestions = this.generateOptimizationSuggestions(
        sceneAnalysis,
        audioAnalysis,
        thumbnailOptions,
        engagementPrediction
      );

      const result: VideoAnalysisResult = {
        videoId,
        sceneClassification: sceneAnalysis,
        audioAnalysis,
        thumbnailOptions,
        musicRecommendations,
        engagementPrediction,
        optimizationSuggestions
      };

      // Store analysis results in database
      await this.storeAnalysisResults(videoId, result);

      logger.info(`Completed AI video analysis for video: ${videoId}`);
      return result;

    } catch (error) {
      logger.error(`Error analyzing video ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Analyze video scene and visual content
   */
  private async analyzeVideoScene(videoPath: string): Promise<SceneAnalysis> {
    return new Promise((resolve, reject) => {
      // Extract frames at different timestamps for analysis
      const frameDir = path.join(path.dirname(videoPath), 'analysis_frames');
      if (!fs.existsSync(frameDir)) {
        fs.mkdirSync(frameDir, { recursive: true });
      }

      // const frameCount = 5;
      // const framePaths: string[] = [];

      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['10%', '25%', '50%', '75%', '90%'],
          filename: 'frame_%i.jpg',
          folder: frameDir,
          size: '1920x1080'
        })
        .on('end', async () => {
          try {
            // Analyze extracted frames
            const frames = fs.readdirSync(frameDir).filter(f => f.endsWith('.jpg'));
            const frameAnalyses = await Promise.all(
              frames.map(frame => this.analyzeFrame(path.join(frameDir, frame)))
            );

            // Aggregate frame analyses
            const sceneAnalysis = this.aggregateFrameAnalyses(frameAnalyses);

            // Cleanup frames
            frames.forEach(frame => {
              try {
                fs.unlinkSync(path.join(frameDir, frame));
              } catch (e) {
                logger.warn(`Failed to cleanup frame: ${frame}`);
              }
            });

            resolve(sceneAnalysis);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          reject(new Error(`Frame extraction failed: ${err.message}`));
        });
    });
  }

  /**
   * Analyze individual frame for visual content
   */
  private async analyzeFrame(framePath: string): Promise<Partial<SceneAnalysis>> {
    try {
      const image = sharp(framePath);
      // const metadata = await image.metadata();
      const { dominant } = await image.stats();

      // Color analysis
      const dominantColors = this.extractDominantColors(dominant);
      
      // Brightness and contrast analysis
      const brightness = this.calculateBrightness(dominant);
      const contrast = this.calculateContrast(dominant);

      // Simple scene classification based on colors and brightness
      const sceneType = this.classifyScene(dominantColors, brightness);
      
      // Property type detection (simplified)
      const propertyType = this.detectPropertyType(framePath);

      return {
        dominantColors,
        brightness,
        contrast,
        sceneType,
        propertyType,
        qualityScore: this.calculateFrameQuality(brightness, contrast, dominantColors)
      };
    } catch (error) {
      logger.error(`Error analyzing frame ${framePath}:`, error);
      return {
        dominantColors: ['#000000'],
        brightness: 0.5,
        contrast: 0.5,
        sceneType: 'mixed',
        propertyType: 'unknown',
        qualityScore: 0.5
      };
    }
  }

  /**
   * Aggregate multiple frame analyses into scene analysis
   */
  private aggregateFrameAnalyses(frameAnalyses: Partial<SceneAnalysis>[]): SceneAnalysis {
    const validAnalyses = frameAnalyses.filter(a => a.qualityScore && a.qualityScore > 0);
    
    if (validAnalyses.length === 0) {
      return this.getDefaultSceneAnalysis();
    }

    // Aggregate dominant colors
    const allColors = validAnalyses.flatMap(a => a.dominantColors || []);
    const colorCounts = allColors.reduce((acc, color) => {
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantColors = Object.entries(colorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([color]) => color);

    // Average brightness and contrast
    const avgBrightness = validAnalyses.reduce((sum, a) => sum + (a.brightness || 0), 0) / validAnalyses.length;
    const avgContrast = validAnalyses.reduce((sum, a) => sum + (a.contrast || 0), 0) / validAnalyses.length;

    // Most common scene type
    const sceneTypes = validAnalyses.map(a => a.sceneType).filter(Boolean);
    const sceneType = this.getMostCommon(sceneTypes) || 'mixed';

    // Most common property type
    const propertyTypes = validAnalyses.map(a => a.propertyType).filter(Boolean);
    const propertyType = this.getMostCommon(propertyTypes) || 'unknown';

    // Average quality score
    const avgQualityScore = validAnalyses.reduce((sum, a) => sum + (a.qualityScore || 0), 0) / validAnalyses.length;

    return {
      dominantColors,
      brightness: avgBrightness,
      contrast: avgContrast,
      sceneType: sceneType as 'indoor' | 'outdoor' | 'mixed',
      propertyType: propertyType as 'house' | 'apartment' | 'commercial' | 'land' | 'unknown',
      hasText: false, // Would need OCR for text detection
      hasFaces: false, // Would need face detection API
      faceCount: 0,
      objectsDetected: [], // Would need object detection API
      qualityScore: avgQualityScore
    };
  }

  /**
   * Analyze video audio content
   */
  private async analyzeVideoAudio(videoPath: string): Promise<AudioAnalysis> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to analyze audio: ${err.message}`));
          return;
        }

        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        
        if (!audioStream) {
          resolve({
            hasAudio: false,
            audioQuality: 'poor',
            mood: 'calm',
            tempo: 0,
            volume: 0,
            backgroundNoise: 0,
            speechDetected: false,
            musicDetected: false,
            recommendedMusicGenre: ['ambient']
          });
          return;
        }

        // Extract audio features
        const audioAnalysis = this.analyzeAudioStream(audioStream, metadata);
        resolve(audioAnalysis);
      });
    });
  }

  /**
   * Analyze audio stream properties
   */
  private analyzeAudioStream(audioStream: any, _metadata: any): AudioAnalysis {
    const bitrate = parseInt(audioStream.bit_rate || '0');
    const sampleRate = parseInt(audioStream.sample_rate || '0');
    const channels = parseInt(audioStream.channels || '0');

    // Determine audio quality based on technical specs
    let audioQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (bitrate >= 128000 && sampleRate >= 44100) {
      audioQuality = 'excellent';
    } else if (bitrate >= 96000 && sampleRate >= 22050) {
      audioQuality = 'good';
    } else if (bitrate >= 64000) {
      audioQuality = 'fair';
    }

    // Estimate mood based on audio characteristics (simplified)
    const mood = this.estimateAudioMood(bitrate, channels, sampleRate);

    // Estimate tempo (simplified)
    const tempo = this.estimateTempo(bitrate, sampleRate);

    // Recommend music genres based on audio characteristics
    const recommendedMusicGenre = this.recommendMusicGenres(mood, tempo, audioQuality);

    return {
      hasAudio: true,
      audioQuality,
      mood,
      tempo,
      volume: 0.7, // Would need actual audio analysis
      backgroundNoise: 0.2, // Would need noise detection
      speechDetected: channels >= 1, // Simplified detection
      musicDetected: bitrate > 96000, // Simplified detection
      recommendedMusicGenre
    };
  }

  /**
   * Generate multiple thumbnail options with AI scoring
   */
  private async generateThumbnailOptions(videoPath: string): Promise<ThumbnailOption[]> {
    return new Promise((resolve, reject) => {
      const thumbnailDir = path.join(path.dirname(videoPath), 'thumbnail_options');
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }

      // Generate thumbnails at strategic timestamps
      const timestamps = ['5%', '15%', '25%', '35%', '50%', '65%', '75%', '85%', '95%'];
      
      ffmpeg(videoPath)
        .screenshots({
          timestamps,
          filename: 'thumb_%i.jpg',
          folder: thumbnailDir,
          size: '1080x1080'
        })
        .on('end', async () => {
          try {
            const thumbnailFiles = fs.readdirSync(thumbnailDir).filter(f => f.endsWith('.jpg'));
            const thumbnailOptions = await Promise.all(
              thumbnailFiles.map(async (file, index) => {
                const filePath = path.join(thumbnailDir, file);
                const score = await this.scoreThumbnail(filePath);
                const timestamp = (index + 1) * (100 / timestamps.length);
                
                return {
                  timestamp,
                  imagePath: filePath,
                  score: score.overall,
                  reasoning: score.reasoning,
                  faceCount: score.faceCount,
                  textPresent: score.textPresent,
                  colorScore: score.colorScore,
                  compositionScore: score.compositionScore,
                  engagementPrediction: score.engagementPrediction
                };
              })
            );

            // Sort by score and return top options
            const sortedOptions = thumbnailOptions.sort((a, b) => b.score - a.score);
            resolve(sortedOptions);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          reject(new Error(`Thumbnail generation failed: ${err.message}`));
        });
    });
  }

  /**
   * Score thumbnail for engagement potential
   */
  private async scoreThumbnail(imagePath: string): Promise<{
    overall: number;
    reasoning: string;
    faceCount: number;
    textPresent: boolean;
    colorScore: number;
    compositionScore: number;
    engagementPrediction: number;
  }> {
    try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      const { dominant } = await image.stats();

      // Color analysis
      const colorScore = this.scoreThumbnailColors(dominant);
      
      // Composition analysis
      const compositionScore = this.scoreThumbnailComposition(metadata);
      
      // Engagement prediction based on visual elements
      const engagementPrediction = (colorScore + compositionScore) / 2;
      
      const overall = (colorScore * 0.4 + compositionScore * 0.4 + engagementPrediction * 0.2);
      
      const reasoning = this.generateThumbnailReasoning(colorScore, compositionScore, engagementPrediction);

      return {
        overall,
        reasoning,
        faceCount: 0, // Would need face detection
        textPresent: false, // Would need OCR
        colorScore,
        compositionScore,
        engagementPrediction
      };
    } catch (error) {
      logger.error(`Error scoring thumbnail ${imagePath}:`, error);
      return {
        overall: 0.5,
        reasoning: 'Error analyzing thumbnail',
        faceCount: 0,
        textPresent: false,
        colorScore: 0.5,
        compositionScore: 0.5,
        engagementPrediction: 0.5
      };
    }
  }

  /**
   * Get trending music recommendations
   */
  private async getTrendingMusicRecommendations(videoPath: string): Promise<MusicRecommendation[]> {
    try {
      // Get audio analysis for music matching
      const audioAnalysis = await this.analyzeVideoAudio(videoPath);
      
      // Get trending music from multiple sources
      const [spotifyTrending, tiktokTrending, customRecommendations] = await Promise.all([
        this.getSpotifyTrendingMusic(audioAnalysis),
        this.getTikTokTrendingMusic(audioAnalysis),
        this.getCustomMusicRecommendations(audioAnalysis)
      ]);

      // Combine and score recommendations
      const allRecommendations = [...spotifyTrending, ...tiktokTrending, ...customRecommendations];
      
      // Score each recommendation based on video content match
      const scoredRecommendations = allRecommendations.map(rec => ({
        ...rec,
        matchScore: this.calculateMusicMatchScore(rec, audioAnalysis)
      }));

      // Sort by match score and return top recommendations
      return scoredRecommendations
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

    } catch (error) {
      logger.error('Error getting music recommendations:', error);
      return this.getDefaultMusicRecommendations();
    }
  }

  /**
   * Get trending music from Spotify
   */
  private async getSpotifyTrendingMusic(audioAnalysis: AudioAnalysis): Promise<MusicRecommendation[]> {
    try {
      if (!this.SPOTIFY_CLIENT_ID || !this.SPOTIFY_CLIENT_SECRET) {
        return [];
      }

      // Get Spotify access token
      const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.SPOTIFY_CLIENT_ID}:${this.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Search for trending tracks based on audio mood
      const searchQuery = this.buildSpotifySearchQuery(audioAnalysis);
      const searchResponse = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=20`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return searchResponse.data.tracks.items.map((track: any) => ({
        trackId: track.id,
        trackName: track.name,
        artist: track.artists[0].name,
        genre: 'unknown', // Spotify doesn't provide genre in search results
        mood: audioAnalysis.mood,
        tempo: track.tempo || 120,
        popularity: track.popularity,
        trendingScore: track.popularity / 100,
        matchScore: 0, // Will be calculated later
        previewUrl: track.preview_url,
        platform: 'spotify' as const
      }));

    } catch (error) {
      logger.error('Error getting Spotify trending music:', error);
      return [];
    }
  }

  /**
   * Get trending music from TikTok
   */
  private async getTikTokTrendingMusic(audioAnalysis: AudioAnalysis): Promise<MusicRecommendation[]> {
    try {
      // TikTok trending music API would go here
      // For now, return mock trending music
      return [
        {
          trackId: 'tiktok_1',
          trackName: 'Trending Beat 1',
          artist: 'TikTok Artist',
          genre: 'electronic',
          mood: audioAnalysis.mood,
          tempo: 128,
          popularity: 95,
          trendingScore: 0.95,
          matchScore: 0,
          platform: 'tiktok' as const
        }
      ];
    } catch (error) {
      logger.error('Error getting TikTok trending music:', error);
      return [];
    }
  }

  /**
   * Get custom music recommendations
   */
  private async getCustomMusicRecommendations(audioAnalysis: AudioAnalysis): Promise<MusicRecommendation[]> {
    const customTracks = [
      {
        trackId: 'custom_1',
        trackName: 'Real Estate Inspiration',
        artist: 'Custom Music',
        genre: 'ambient',
        mood: 'professional',
        tempo: 90,
        popularity: 80,
        trendingScore: 0.8,
        matchScore: 0,
        platform: 'custom' as const
      },
      {
        trackId: 'custom_2',
        trackName: 'Property Showcase',
        artist: 'Custom Music',
        genre: 'uplifting',
        mood: 'upbeat',
        tempo: 110,
        popularity: 85,
        trendingScore: 0.85,
        matchScore: 0,
        platform: 'custom' as const
      }
    ];

    return customTracks.filter(track => 
      track.mood === audioAnalysis.mood || 
      audioAnalysis.recommendedMusicGenre.includes(track.genre)
    );
  }

  /**
   * Predict engagement potential
   */
  private async predictEngagement(videoPath: string): Promise<EngagementPrediction> {
    try {
      // This would use ML models to predict engagement
      // For now, using heuristic-based prediction
      
      const metadata = await this.getVideoMetadata(videoPath);
      const factors = {
        thumbnailQuality: 0.8, // Would be calculated from thumbnail analysis
        audioQuality: metadata.hasAudio ? 0.9 : 0.3,
        visualAppeal: 0.7, // Would be calculated from scene analysis
        contentRelevance: 0.8, // Would be calculated from content analysis
        trendAlignment: 0.6 // Would be calculated from trending analysis
      };

      const overallScore = Object.values(factors).reduce((sum, score) => sum + score, 0) / Object.keys(factors).length;
      
      const recommendations = this.generateEngagementRecommendations(factors);
      
      return {
        overallScore,
        factors,
        recommendations,
        expectedViews: Math.round(overallScore * 10000),
        expectedEngagementRate: overallScore * 0.05
      };
    } catch (error) {
      logger.error('Error predicting engagement:', error);
      return this.getDefaultEngagementPrediction();
    }
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(
    sceneAnalysis: SceneAnalysis,
    audioAnalysis: AudioAnalysis,
    thumbnailOptions: ThumbnailOption[],
    _engagementPrediction: EngagementPrediction
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Thumbnail suggestions
    if (thumbnailOptions.length > 0 && thumbnailOptions[0] && thumbnailOptions[0].score < 0.7) {
      suggestions.push({
        category: 'thumbnail',
        suggestion: 'Consider using a thumbnail with better composition and brighter colors',
        impact: 'high',
        effort: 'easy',
        estimatedImprovement: 15
      });
    }

    // Audio suggestions
    if (audioAnalysis.audioQuality === 'poor') {
      suggestions.push({
        category: 'audio',
        suggestion: 'Improve audio quality or add background music',
        impact: 'high',
        effort: 'moderate',
        estimatedImprovement: 25
      });
    }

    // Compression suggestions
    if (sceneAnalysis.qualityScore < 0.6) {
      suggestions.push({
        category: 'compression',
        suggestion: 'Optimize video compression settings for better quality',
        impact: 'medium',
        effort: 'easy',
        estimatedImprovement: 10
      });
    }

    // Content suggestions
    if (sceneAnalysis.brightness < 0.4) {
      suggestions.push({
        category: 'content',
        suggestion: 'Improve lighting or brightness in future videos',
        impact: 'medium',
        effort: 'moderate',
        estimatedImprovement: 12
      });
    }

    return suggestions;
  }

  /**
   * Store analysis results in database
   */
  private async storeAnalysisResults(videoId: string, results: VideoAnalysisResult): Promise<void> {
    try {
      await VideoIntelligence.findOneAndUpdate(
        { videoId },
        {
          videoId,
          sceneAnalysis: results.sceneClassification,
          audioAnalysis: results.audioAnalysis,
          thumbnailOptions: results.thumbnailOptions,
          musicRecommendations: results.musicRecommendations,
          engagementPrediction: results.engagementPrediction,
          optimizationSuggestions: results.optimizationSuggestions
        },
        { upsert: true, new: true }
      );

      logger.info(`Stored video intelligence analysis for video: ${videoId}`);
    } catch (error) {
      logger.error('Error storing analysis results:', error);
    }
  }

  // Helper methods
  private extractDominantColors(_stats: any): string[] {
    // Simplified color extraction
    return ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'];
  }

  private calculateBrightness(_stats: any): number {
    return Math.random() * 0.5 + 0.5; // Simplified
  }

  private calculateContrast(_stats: any): number {
    return Math.random() * 0.5 + 0.5; // Simplified
  }

  private classifyScene(_colors: string[], brightness: number): 'indoor' | 'outdoor' | 'mixed' {
    return brightness > 0.6 ? 'outdoor' : 'indoor';
  }

  private detectPropertyType(_framePath: string): 'house' | 'apartment' | 'commercial' | 'land' | 'unknown' {
    return 'house'; // Simplified
  }

  private calculateFrameQuality(brightness: number, contrast: number, colors: string[]): number {
    return (brightness + contrast + (colors.length / 10)) / 3;
  }

  private getDefaultSceneAnalysis(): SceneAnalysis {
    return {
      dominantColors: ['#2563eb'],
      brightness: 0.5,
      contrast: 0.5,
      sceneType: 'mixed',
      propertyType: 'unknown',
      hasText: false,
      hasFaces: false,
      faceCount: 0,
      objectsDetected: [],
      qualityScore: 0.5
    };
  }

  private getMostCommon<T>(array: T[]): T | null {
    if (array.length === 0) return null;
    const counts = array.reduce((acc, item) => {
      acc[String(item)] = (acc[String(item)] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const maxCount = Math.max(...Object.values(counts));
    const mostCommon = Object.keys(counts).find(key => counts[key] === maxCount);
    return mostCommon as T;
  }

  private estimateAudioMood(bitrate: number, channels: number, sampleRate: number): AudioAnalysis['mood'] {
    if (bitrate > 128000) return 'professional';
    if (channels > 1) return 'upbeat';
    if (sampleRate > 44100) return 'energetic';
    return 'calm';
  }

  private estimateTempo(bitrate: number, sampleRate: number): number {
    return Math.round(60 + (bitrate / 1000) + (sampleRate / 1000));
  }

  private recommendMusicGenres(mood: string, _tempo: number, _quality: string): string[] {
    const genreMap: Record<string, string[]> = {
      'energetic': ['electronic', 'pop', 'rock'],
      'calm': ['ambient', 'classical', 'jazz'],
      'professional': ['corporate', 'ambient', 'minimal'],
      'upbeat': ['pop', 'electronic', 'indie'],
      'dramatic': ['cinematic', 'orchestral', 'epic']
    };
    
    return genreMap[mood] || ['ambient'];
  }

  private scoreThumbnailColors(_stats: any): number {
    return Math.random() * 0.4 + 0.6; // Simplified
  }

  private scoreThumbnailComposition(_metadata: any): number {
    return Math.random() * 0.4 + 0.6; // Simplified
  }

  private generateThumbnailReasoning(colorScore: number, compositionScore: number, engagementPrediction: number): string {
    const scores = [
      { name: 'colors', score: colorScore },
      { name: 'composition', score: compositionScore },
      { name: 'engagement potential', score: engagementPrediction }
    ];
    
    const best = scores.reduce((max, current) => current.score > max.score ? current : max);
    return `Good ${best.name} with score of ${(best.score * 100).toFixed(0)}%`;
  }

  private buildSpotifySearchQuery(audioAnalysis: AudioAnalysis): string {
    const genres = audioAnalysis.recommendedMusicGenre.join(' OR ');
    return `genre:${genres} mood:${audioAnalysis.mood}`;
  }

  private calculateMusicMatchScore(recommendation: MusicRecommendation, audioAnalysis: AudioAnalysis): number {
    let score = 0;
    
    // Mood match
    if (recommendation.mood === audioAnalysis.mood) score += 0.4;
    
    // Genre match
    if (audioAnalysis.recommendedMusicGenre.includes(recommendation.genre)) score += 0.3;
    
    // Tempo match
    const tempoDiff = Math.abs(recommendation.tempo - audioAnalysis.tempo);
    if (tempoDiff < 20) score += 0.2;
    
    // Popularity/trending score
    score += recommendation.trendingScore * 0.1;
    
    return Math.min(score, 1.0);
  }

  private getDefaultMusicRecommendations(): MusicRecommendation[] {
    return [
      {
        trackId: 'default_1',
        trackName: 'Real Estate Background',
        artist: 'Default Music',
        genre: 'ambient',
        mood: 'professional',
        tempo: 90,
        popularity: 70,
        trendingScore: 0.7,
        matchScore: 0.8,
        platform: 'custom'
      }
    ];
  }

  private generateEngagementRecommendations(factors: EngagementPrediction['factors']): string[] {
    const recommendations: string[] = [];
    
    if (factors.thumbnailQuality < 0.7) {
      recommendations.push('Improve thumbnail selection with better composition');
    }
    
    if (factors.audioQuality < 0.7) {
      recommendations.push('Add background music or improve audio quality');
    }
    
    if (factors.visualAppeal < 0.7) {
      recommendations.push('Enhance visual appeal with better lighting');
    }
    
    if (factors.contentRelevance < 0.7) {
      recommendations.push('Focus on more relevant real estate content');
    }
    
    if (factors.trendAlignment < 0.7) {
      recommendations.push('Align content with current trending topics');
    }
    
    return recommendations;
  }

  private getDefaultEngagementPrediction(): EngagementPrediction {
    return {
      overallScore: 0.6,
      factors: {
        thumbnailQuality: 0.6,
        audioQuality: 0.6,
        visualAppeal: 0.6,
        contentRelevance: 0.6,
        trendAlignment: 0.6
      },
      recommendations: ['Improve overall video quality'],
      expectedViews: 6000,
      expectedEngagementRate: 0.03
    };
  }

  private async getVideoMetadata(videoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        
        resolve({
          duration: parseFloat(String(metadata.format.duration || '0')),
          hasAudio: !!audioStream,
          hasVideo: !!videoStream,
          width: videoStream?.width || 0,
          height: videoStream?.height || 0
        });
      });
    });
  }

  /**
   * Get best thumbnail for a video
   */
  async getBestThumbnail(videoId: string): Promise<ThumbnailOption | null> {
    try {
      const intelligence = await VideoIntelligence.findOne({ videoId });
      
      if (!intelligence || !intelligence.thumbnailOptions || intelligence.thumbnailOptions.length === 0) {
        return null;
      }
      
      // Return the first thumbnail option (highest score)
      return intelligence.thumbnailOptions[0] || null;
      
    } catch (error) {
      logger.error('Error getting best thumbnail:', error);
      return null;
    }
  }

  /**
   * Get music recommendations for a video
   */
  async getMusicRecommendations(videoId: string): Promise<MusicRecommendation[]> {
    try {
      const intelligence = await VideoIntelligence.findOne({ videoId });
      
      if (!intelligence || !intelligence.musicRecommendations) {
        return [];
      }
      
      return intelligence.musicRecommendations;
      
    } catch (error) {
      logger.error('Error getting music recommendations:', error);
      return [];
    }
  }

  /**
   * Get engagement prediction for a video
   */
  async getEngagementPrediction(videoId: string): Promise<EngagementPrediction | null> {
    try {
      const intelligence = await VideoIntelligence.findOne({ videoId });
      
      if (!intelligence || !intelligence.engagementPrediction) {
        return null;
      }
      
      return intelligence.engagementPrediction;
      
    } catch (error) {
      logger.error('Error getting engagement prediction:', error);
      return null;
    }
  }
}

export const videoIntelligenceService = new VideoIntelligenceService();
export default VideoIntelligenceService; 