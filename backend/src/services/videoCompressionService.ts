import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import { VideoOptimization, VideoOptimizationCreateInput } from '../models/VideoOptimization';

// Video metadata interface for compression analysis
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
  hasAudio: boolean;
  format: string;
  fileSize: number;
  aspectRatio: number;
  audioCodec?: string;
  audioSampleRate?: number;
  audioChannels?: number;
}

// Configure ffmpeg path
import ffmpegStatic from 'ffmpeg-static';
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export interface CompressionSettings {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'universal';
  contentType: 'real_estate' | 'cartoon' | 'mixed';
  quality: 'maximum' | 'high' | 'medium' | 'low' | 'minimal';
  targetFileSize?: number; // in MB
  maxDuration?: number; // in seconds
  preserveAudio: boolean;
  enhanceVisuals: boolean;
  optimizeForMobile: boolean;
}

export interface CompressionResult {
  success: boolean;
  originalPath: string;
  compressedPath: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  qualityScore: number;
  processingTime: number;
  settings: CompressionSettings;
  metadata: VideoMetadata;
  optimizations: OptimizationApplied[];
  warnings: string[];
}

export interface OptimizationApplied {
  type: 'resolution' | 'bitrate' | 'fps' | 'codec' | 'audio' | 'filters';
  description: string;
  impact: 'high' | 'medium' | 'low';
  sizeSaving: number; // percentage
  qualityImpact: number; // 0-1 scale
}

export interface PlatformRequirements {
  maxFileSize: number; // MB
  maxDuration: number; // seconds
  recommendedResolution: { width: number; height: number };
  maxResolution: { width: number; height: number };
  recommendedBitrate: number;
  maxBitrate: number;
  recommendedFps: number;
  maxFps: number;
  supportedCodecs: string[];
  aspectRatios: number[];
  audioRequired: boolean;
}

export class VideoCompressionService {
  private readonly platformRequirements: Record<string, PlatformRequirements> = {
    instagram: {
      maxFileSize: 100,
      maxDuration: 60,
      recommendedResolution: { width: 1080, height: 1080 },
      maxResolution: { width: 1080, height: 1920 },
      recommendedBitrate: 3500,
      maxBitrate: 8000,
      recommendedFps: 30,
      maxFps: 30,
      supportedCodecs: ['h264', 'h265'],
      aspectRatios: [1, 4 / 5, 16 / 9],
      audioRequired: false,
    },
    tiktok: {
      maxFileSize: 500,
      maxDuration: 180,
      recommendedResolution: { width: 1080, height: 1920 },
      maxResolution: { width: 1080, height: 1920 },
      recommendedBitrate: 4000,
      maxBitrate: 12000,
      recommendedFps: 30,
      maxFps: 60,
      supportedCodecs: ['h264', 'h265'],
      aspectRatios: [9 / 16, 1, 16 / 9],
      audioRequired: true,
    },
    youtube: {
      maxFileSize: 2000,
      maxDuration: 60,
      recommendedResolution: { width: 1080, height: 1920 },
      maxResolution: { width: 1080, height: 1920 },
      recommendedBitrate: 6000,
      maxBitrate: 15000,
      recommendedFps: 30,
      maxFps: 60,
      supportedCodecs: ['h264', 'h265', 'vp9'],
      aspectRatios: [9 / 16, 1, 16 / 9],
      audioRequired: false,
    },
    universal: {
      maxFileSize: 100,
      maxDuration: 60,
      recommendedResolution: { width: 1080, height: 1080 },
      maxResolution: { width: 1080, height: 1920 },
      recommendedBitrate: 3500,
      maxBitrate: 8000,
      recommendedFps: 30,
      maxFps: 30,
      supportedCodecs: ['h264'],
      aspectRatios: [1, 4 / 5, 16 / 9, 9 / 16],
      audioRequired: false,
    },
  };

  /**
   * Compress video with intelligent optimization
   */
  async compressVideo(
    inputPath: string,
    outputPath: string,
    settings: CompressionSettings
  ): Promise<CompressionResult> {
    const startTime = Date.now();

    try {
      logger.info(`Starting intelligent video compression: ${inputPath}`);

      // Analyze input video
      const originalMetadata = await this.analyzeVideo(inputPath);
      const originalSize = fs.statSync(inputPath).size;

      // Determine optimal compression parameters
      const compressionParams = this.calculateOptimalParameters(originalMetadata, settings);

      // Apply compression with optimizations
      const compressedPath = await this.performCompression(
        inputPath,
        outputPath,
        compressionParams,
        settings
      );

      // Analyze compressed video
      const compressedMetadata = await this.analyzeVideo(compressedPath);
      const compressedSize = fs.statSync(compressedPath).size;

      // Calculate metrics
      const compressionRatio = (originalSize - compressedSize) / originalSize;
      const qualityScore = await this.assessQuality(originalMetadata, compressedMetadata);
      const processingTime = Date.now() - startTime;

      const result: CompressionResult = {
        success: true,
        originalPath: inputPath,
        compressedPath,
        originalSize,
        compressedSize,
        compressionRatio,
        qualityScore,
        processingTime,
        settings,
        metadata: compressedMetadata,
        optimizations: compressionParams.optimizations,
        warnings: compressionParams.warnings,
      };

      // Store compression results
      await this.storeCompressionResult(result);

      logger.info(
        `Compression completed: ${(compressionRatio * 100).toFixed(1)}% reduction, quality: ${(qualityScore * 100).toFixed(1)}%`
      );
      return result;
    } catch (error) {
      logger.error(`Video compression failed: ${error}`);
      return {
        success: false,
        originalPath: inputPath,
        compressedPath: outputPath,
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        qualityScore: 0,
        processingTime: Date.now() - startTime,
        settings,
        metadata: this.getDefaultMetadata(),
        optimizations: [],
        warnings: [`Compression failed: ${error}`],
      };
    }
  }

  /**
   * Analyze video metadata
   */
  private async analyzeVideo(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to analyze video: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find((stream) => stream.codec_type === 'video');
        const audioStream = metadata.streams.find((stream) => stream.codec_type === 'audio');

        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const videoMetadata: VideoMetadata = {
          duration: parseFloat(String(metadata.format.duration || '0')),
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: this.calculateFps(videoStream.r_frame_rate || '30/1'),
          bitrate: parseInt(String(metadata.format.bit_rate || '0')),
          codec: videoStream.codec_name || 'unknown',
          hasAudio: !!audioStream,
          format: path.extname(videoPath).toLowerCase().substring(1),
          fileSize: metadata.format.size || 0,
          audioCodec: audioStream?.codec_name,
          aspectRatio: (videoStream.width || 1) / (videoStream.height || 1),
          audioChannels: audioStream ? parseInt(String(audioStream.channels || '0')) : 0,
          audioSampleRate: audioStream ? parseInt(String(audioStream.sample_rate || '0')) : 0,
        };

        resolve(videoMetadata);
      });
    });
  }

  /**
   * Calculate optimal compression parameters
   */
  private calculateOptimalParameters(
    metadata: VideoMetadata,
    settings: CompressionSettings
  ): {
    ffmpegOptions: string[];
    optimizations: OptimizationApplied[];
    warnings: string[];
  } {
    const platformReqs =
      this.platformRequirements[settings.platform] || this.platformRequirements.universal!;
    const ffmpegOptions: string[] = [];
    const optimizations: OptimizationApplied[] = [];
    const warnings: string[] = [];

    // Video codec selection
    const codec = this.selectOptimalCodec(metadata, settings, platformReqs);
    ffmpegOptions.push('-c:v', codec);

    // Resolution optimization
    const resolution = this.calculateOptimalResolution(metadata, settings, platformReqs);
    if (resolution.width !== metadata.width || resolution.height !== metadata.height) {
      ffmpegOptions.push('-vf', `scale=${resolution.width}:${resolution.height}`);
      optimizations.push({
        type: 'resolution',
        description: `Resized from ${metadata.width}x${metadata.height} to ${resolution.width}x${resolution.height}`,
        impact: 'high',
        sizeSaving: this.calculateResolutionSaving(metadata, resolution),
        qualityImpact: 0.1,
      });
    }

    // Bitrate optimization
    const bitrate = this.calculateOptimalBitrate(metadata, settings, platformReqs);
    if (bitrate !== metadata.bitrate) {
      ffmpegOptions.push('-b:v', `${bitrate}k`);
      optimizations.push({
        type: 'bitrate',
        description: `Bitrate adjusted from ${Math.round(metadata.bitrate / 1000)}k to ${bitrate}k`,
        impact: 'high',
        sizeSaving: (Math.abs(bitrate - metadata.bitrate / 1000) / (metadata.bitrate / 1000)) * 100,
        qualityImpact: bitrate < metadata.bitrate / 1000 ? 0.15 : 0,
      });
    }

    // FPS optimization
    const fps = this.calculateOptimalFps(metadata, settings, platformReqs);
    if (fps !== metadata.fps) {
      ffmpegOptions.push('-r', String(fps));
      optimizations.push({
        type: 'fps',
        description: `Frame rate adjusted from ${metadata.fps} to ${fps}`,
        impact: 'medium',
        sizeSaving: (Math.abs(fps - metadata.fps) / metadata.fps) * 30,
        qualityImpact: fps < metadata.fps ? 0.05 : 0,
      });
    }

    // Audio optimization
    if (settings.preserveAudio && metadata.hasAudio) {
      const audioSettings = this.calculateOptimalAudioSettings(metadata, settings, platformReqs);
      ffmpegOptions.push('-c:a', audioSettings.codec);
      ffmpegOptions.push('-b:a', `${audioSettings.bitrate}k`);

      if (audioSettings.bitrate !== (metadata.audioSampleRate || 128) / 1000) {
        optimizations.push({
          type: 'audio',
          description: `Audio bitrate optimized to ${audioSettings.bitrate}k`,
          impact: 'low',
          sizeSaving: 5,
          qualityImpact: 0.02,
        });
      }
    } else if (!settings.preserveAudio) {
      ffmpegOptions.push('-an');
      optimizations.push({
        type: 'audio',
        description: 'Audio removed',
        impact: 'medium',
        sizeSaving: 20,
        qualityImpact: 0,
      });
    }

    // Content-specific optimizations
    if (settings.contentType === 'real_estate') {
      // Real estate videos benefit from higher quality, lower motion
      ffmpegOptions.push('-preset', 'slow');
      ffmpegOptions.push('-crf', '23');

      if (settings.enhanceVisuals) {
        ffmpegOptions.push('-vf', 'unsharp=5:5:1.0:5:5:0.0');
        optimizations.push({
          type: 'filters',
          description: 'Enhanced sharpness for real estate content',
          impact: 'low',
          sizeSaving: 0,
          qualityImpact: -0.05, // Negative means quality improvement
        });
      }
    } else if (settings.contentType === 'cartoon') {
      // Cartoon videos can use higher compression
      ffmpegOptions.push('-preset', 'medium');
      ffmpegOptions.push('-crf', '28');
    } else {
      // Mixed content - balanced approach
      ffmpegOptions.push('-preset', 'medium');
      ffmpegOptions.push('-crf', '25');
    }

    // Mobile optimization
    if (settings.optimizeForMobile) {
      ffmpegOptions.push('-profile:v', 'baseline');
      ffmpegOptions.push('-level', '3.0');
      optimizations.push({
        type: 'codec',
        description: 'Optimized for mobile playback',
        impact: 'low',
        sizeSaving: 0,
        qualityImpact: 0.02,
      });
    }

    // Quality-based adjustments
    const qualityAdjustments = this.getQualityAdjustments(settings.quality);
    ffmpegOptions.push(...qualityAdjustments);

    // File size constraints
    if (settings.targetFileSize) {
      const targetBitrate = this.calculateTargetBitrate(metadata, settings.targetFileSize);
      ffmpegOptions.push('-b:v', `${targetBitrate}k`);
      warnings.push(`Target file size may affect quality`);
    }

    return { ffmpegOptions, optimizations, warnings };
  }

  /**
   * Perform the actual compression
   */
  private async performCompression(
    inputPath: string,
    outputPath: string,
    params: { ffmpegOptions: string[]; optimizations: OptimizationApplied[]; warnings: string[] },
    _settings: CompressionSettings
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath);

      // Apply all calculated options
      for (let i = 0; i < params.ffmpegOptions.length; i += 2) {
        const option = params.ffmpegOptions[i];
        const value = params.ffmpegOptions[i + 1];
        if (option && value !== undefined) {
          command.addOption(option, value);
        } else if (option) {
          command.addOption(option);
        }
      }

      command
        .output(outputPath)
        .on('start', (commandLine) => {
          logger.info(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            logger.info(`Compression progress: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', () => {
          logger.info(`Compression completed: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          logger.error(`Compression error: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Assess quality of compressed video
   */
  private async assessQuality(
    originalMetadata: VideoMetadata,
    compressedMetadata: VideoMetadata
  ): Promise<number> {
    let qualityScore = 1.0;

    // Resolution impact
    const resolutionRatio =
      (compressedMetadata.width * compressedMetadata.height) /
      (originalMetadata.width * originalMetadata.height);
    qualityScore *= Math.min(resolutionRatio + 0.2, 1.0);

    // Bitrate impact
    const bitrateRatio = compressedMetadata.bitrate / originalMetadata.bitrate;
    qualityScore *= Math.min(bitrateRatio + 0.3, 1.0);

    // FPS impact
    const fpsRatio = compressedMetadata.fps / originalMetadata.fps;
    qualityScore *= Math.min(fpsRatio + 0.1, 1.0);

    // Audio impact
    if (originalMetadata.hasAudio && !compressedMetadata.hasAudio) {
      qualityScore *= 0.9; // 10% penalty for removing audio
    }

    return Math.max(qualityScore, 0.1); // Minimum quality score
  }

  /**
   * Store compression results for analytics
   */
  private async storeCompressionResult(result: CompressionResult): Promise<void> {
    try {
      const optimizationData: VideoOptimizationCreateInput = {
        videoId: path.basename(result.originalPath, path.extname(result.originalPath)),
        optimizationType: 'compression',
        beforeValue: result.originalSize,
        afterValue: result.compressedSize,
        improvementPercentage: result.compressionRatio * 100,
        settings: {
          platform: result.settings.platform,
          contentType: result.settings.contentType,
          quality: result.settings.quality,
          targetFileSize: result.settings.targetFileSize,
          maxDuration: result.settings.maxDuration,
          preserveAudio: result.settings.preserveAudio,
          enhanceVisuals: result.settings.enhanceVisuals,
          optimizeForMobile: result.settings.optimizeForMobile,
        },
        compressionResult: {
          originalPath: result.originalPath,
          compressedPath: result.compressedPath,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          compressionRatio: result.compressionRatio,
          qualityScore: result.qualityScore,
          processingTime: result.processingTime,
        },
        optimizations: result.optimizations.map((opt) => ({
          type: opt.type,
          description: opt.description,
          impact: opt.impact,
          sizeSaving: opt.sizeSaving,
          qualityImpact: opt.qualityImpact,
        })),
        warnings: result.warnings,
      };

      const optimization = new VideoOptimization(optimizationData);
      await optimization.save();

      logger.info(`Stored compression result for: ${result.originalPath}`);
    } catch (error) {
      logger.error('Error storing compression result:', error);
    }
  }

  // Helper methods for calculations
  private calculateFps(frameRate: string): number {
    const parts = frameRate.split('/');
    if (parts.length === 2 && parts[0] && parts[1]) {
      return parseFloat(parts[0]) / parseFloat(parts[1]);
    }
    return parseFloat(frameRate) || 30;
  }

  private selectOptimalCodec(
    _metadata: VideoMetadata,
    settings: CompressionSettings,
    platformReqs: PlatformRequirements
  ): string {
    // Prefer H.265 for better compression, fallback to H.264 for compatibility
    if (settings.quality === 'maximum' && platformReqs.supportedCodecs.includes('h265')) {
      return 'libx265';
    }
    return 'libx264';
  }

  private calculateOptimalResolution(
    metadata: VideoMetadata,
    settings: CompressionSettings,
    platformReqs: PlatformRequirements
  ): { width: number; height: number } {
    const maxWidth = platformReqs.maxResolution.width;
    const maxHeight = platformReqs.maxResolution.height;
    const recWidth = platformReqs.recommendedResolution.width;
    const recHeight = platformReqs.recommendedResolution.height;

    // Don't upscale
    if (metadata.width <= recWidth && metadata.height <= recHeight) {
      return { width: metadata.width, height: metadata.height };
    }

    // Scale down maintaining aspect ratio
    const aspectRatio = metadata.width / metadata.height;

    if (settings.quality === 'maximum') {
      // Use maximum allowed resolution
      if (aspectRatio > 1) {
        return { width: maxWidth, height: Math.round(maxWidth / aspectRatio) };
      } else {
        return { width: Math.round(maxHeight * aspectRatio), height: maxHeight };
      }
    } else {
      // Use recommended resolution
      if (aspectRatio > 1) {
        return { width: recWidth, height: Math.round(recWidth / aspectRatio) };
      } else {
        return { width: Math.round(recHeight * aspectRatio), height: recHeight };
      }
    }
  }

  private calculateOptimalBitrate(
    _metadata: VideoMetadata,
    settings: CompressionSettings,
    platformReqs: PlatformRequirements
  ): number {
    const baseBitrate = platformReqs.recommendedBitrate;
    const maxBitrate = platformReqs.maxBitrate;

    switch (settings.quality) {
      case 'maximum':
        return Math.min(maxBitrate, baseBitrate * 1.5);
      case 'high':
        return baseBitrate;
      case 'medium':
        return Math.round(baseBitrate * 0.7);
      case 'low':
        return Math.round(baseBitrate * 0.5);
      case 'minimal':
        return Math.round(baseBitrate * 0.3);
      default:
        return baseBitrate;
    }
  }

  private calculateOptimalFps(
    metadata: VideoMetadata,
    settings: CompressionSettings,
    platformReqs: PlatformRequirements
  ): number {
    const maxFps = platformReqs.maxFps;
    const recFps = platformReqs.recommendedFps;

    // Don't increase FPS
    if (metadata.fps <= recFps) {
      return metadata.fps;
    }

    // For real estate, lower FPS is often acceptable
    if (settings.contentType === 'real_estate') {
      return Math.min(recFps, 24);
    }

    return Math.min(metadata.fps, maxFps);
  }

  private calculateOptimalAudioSettings(
    _metadata: VideoMetadata,
    settings: CompressionSettings,
    _platformReqs: PlatformRequirements
  ): { codec: string; bitrate: number } {
    const codec = 'aac'; // Universal compatibility

    let bitrate = 128; // Default

    switch (settings.quality) {
      case 'maximum':
        bitrate = 192;
        break;
      case 'high':
        bitrate = 128;
        break;
      case 'medium':
        bitrate = 96;
        break;
      case 'low':
        bitrate = 64;
        break;
      case 'minimal':
        bitrate = 32;
        break;
    }

    return { codec, bitrate };
  }

  private getQualityAdjustments(quality: CompressionSettings['quality']): string[] {
    switch (quality) {
      case 'maximum':
        return ['-crf', '18', '-preset', 'slow'];
      case 'high':
        return ['-crf', '23', '-preset', 'medium'];
      case 'medium':
        return ['-crf', '28', '-preset', 'medium'];
      case 'low':
        return ['-crf', '32', '-preset', 'fast'];
      case 'minimal':
        return ['-crf', '36', '-preset', 'veryfast'];
      default:
        return ['-crf', '25', '-preset', 'medium'];
    }
  }

  private calculateTargetBitrate(metadata: VideoMetadata, targetSizeMB: number): number {
    const targetSizeBytes = targetSizeMB * 1024 * 1024;
    const durationSeconds = metadata.duration;

    // Calculate bitrate needed for target file size (accounting for audio)
    const audioBitrate = metadata.hasAudio ? 128000 : 0; // 128kbps for audio
    const availableForVideo = targetSizeBytes * 8 - audioBitrate * durationSeconds;

    return Math.max(Math.round(availableForVideo / durationSeconds / 1000), 500); // Minimum 500kbps
  }

  private calculateResolutionSaving(
    originalMetadata: VideoMetadata,
    newResolution: { width: number; height: number }
  ): number {
    const originalPixels = originalMetadata.width * originalMetadata.height;
    const newPixels = newResolution.width * newResolution.height;

    return ((originalPixels - newPixels) / originalPixels) * 100;
  }

  private getDefaultMetadata(): VideoMetadata {
    return {
      duration: 0,
      width: 0,
      height: 0,
      fps: 30,
      bitrate: 0,
      codec: 'unknown',
      hasAudio: false,
      format: 'unknown',
      fileSize: 0,
      aspectRatio: 1,
    };
  }

  /**
   * Get compression recommendations for a video
   */
  async getCompressionRecommendations(
    videoPath: string,
    targetPlatform: string,
    contentType: 'real_estate' | 'cartoon' | 'mixed'
  ): Promise<{
    recommendations: CompressionSettings[];
    analysis: VideoMetadata;
    warnings: string[];
  }> {
    try {
      const metadata = await this.analyzeVideo(videoPath);
      const platformReqs =
        this.platformRequirements[targetPlatform] || this.platformRequirements.universal!;
      const warnings: string[] = [];

      // Check for potential issues
      if (metadata.duration > platformReqs.maxDuration) {
        warnings.push(
          `Video duration (${metadata.duration}s) exceeds platform limit (${platformReqs.maxDuration}s)`
        );
      }

      const fileSizeMB = fs.statSync(videoPath).size / (1024 * 1024);
      if (fileSizeMB > platformReqs.maxFileSize) {
        warnings.push(
          `File size (${fileSizeMB.toFixed(1)}MB) exceeds platform limit (${platformReqs.maxFileSize}MB)`
        );
      }

      // Generate recommendations
      const recommendations: CompressionSettings[] = [
        {
          platform: targetPlatform as any,
          contentType,
          quality: 'high',
          preserveAudio: metadata.hasAudio,
          enhanceVisuals: contentType === 'real_estate',
          optimizeForMobile: true,
        },
        {
          platform: targetPlatform as any,
          contentType,
          quality: 'medium',
          targetFileSize: platformReqs.maxFileSize * 0.8,
          preserveAudio: metadata.hasAudio,
          enhanceVisuals: false,
          optimizeForMobile: true,
        },
        {
          platform: targetPlatform as any,
          contentType,
          quality: 'low',
          targetFileSize: platformReqs.maxFileSize * 0.5,
          preserveAudio: false,
          enhanceVisuals: false,
          optimizeForMobile: true,
        },
      ];

      return {
        recommendations,
        analysis: metadata,
        warnings,
      };
    } catch (error) {
      logger.error('Error getting compression recommendations:', error);
      throw error;
    }
  }
}

export const videoCompressionService = new VideoCompressionService();
export default VideoCompressionService;
