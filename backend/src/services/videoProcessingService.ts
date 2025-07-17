import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { VideoModel } from '../models/Video';

// Configure ffmpeg path
import ffmpegStatic from 'ffmpeg-static';
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  bitrate: number;
  fps: number;
  codec: string;
  size: number;
}

export interface ProcessingOptions {
  generateThumbnail?: boolean;
  compressVideo?: boolean;
  extractMetadata?: boolean;
  maxDuration?: number;
  maxFileSize?: number;
}

export class VideoProcessingService {
  private videoModel: typeof VideoModel;

  constructor() {
    this.videoModel = VideoModel;
  }

  /**
   * Process uploaded video file
   */
  async processVideo(
    filePath: string,
    userId: string,
    options: ProcessingOptions = {}
  ): Promise<{
    metadata: VideoMetadata;
    thumbnailPath?: string;
    processedFilePath?: string;
  }> {
    try {
      logger.info(`Processing video: ${filePath}`);

      // Extract metadata
      const metadata = await this.extractMetadata(filePath);
      logger.info(`Extracted metadata for video: ${metadata.duration}s, ${metadata.width}x${metadata.height}`);

      // Validate video
      await this.validateVideo(metadata, options);

      let thumbnailPath: string | undefined;
      let processedFilePath: string | undefined;

      // Generate thumbnail if requested
      if (options.generateThumbnail) {
        thumbnailPath = await this.generateThumbnail(filePath, metadata);
        logger.info(`Generated thumbnail: ${thumbnailPath}`);
      }

      // Compress video if requested
      if (options.compressVideo) {
        processedFilePath = await this.compressVideo(filePath, metadata);
        logger.info(`Compressed video: ${processedFilePath}`);
      }

      return {
        metadata,
        thumbnailPath,
        processedFilePath: processedFilePath || filePath,
      };
    } catch (error) {
      logger.error('Video processing failed:', error);
      throw new Error(`Video processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract video metadata using ffmpeg
   */
  private async extractMetadata(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to extract metadata: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const stats = fs.statSync(filePath);

        resolve({
          duration: parseFloat(String(metadata.format.duration || '0')),
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          bitrate: parseInt(metadata.format.bit_rate ? String(metadata.format.bit_rate) : '0'),
          fps: parseFloat(videoStream.r_frame_rate?.split('/')[0] || '0') / parseFloat(videoStream.r_frame_rate?.split('/')[1] || '1'),
          codec: videoStream.codec_name || 'unknown',
          size: stats.size,
        });
      });
    });
  }

  /**
   * Validate video against requirements
   */
  private async validateVideo(metadata: VideoMetadata, options: ProcessingOptions): Promise<void> {
    const errors: string[] = [];

    // Check duration
    if (options.maxDuration && metadata.duration > options.maxDuration) {
      errors.push(`Video duration (${metadata.duration}s) exceeds maximum (${options.maxDuration}s)`);
    }

    // Check file size
    if (options.maxFileSize && metadata.size > options.maxFileSize * 1024 * 1024) {
      errors.push(`Video size (${Math.round(metadata.size / 1024 / 1024)}MB) exceeds maximum (${options.maxFileSize}MB)`);
    }

    // Check dimensions (Instagram requirements)
    if (metadata.width < 500 || metadata.height < 500) {
      errors.push('Video dimensions must be at least 500x500 pixels');
    }

    // Check aspect ratio (Instagram prefers 1:1, 4:5, or 16:9)
    const aspectRatio = metadata.width / metadata.height;
    if (aspectRatio < 0.8 || aspectRatio > 1.91) {
      logger.warn(`Video aspect ratio (${aspectRatio.toFixed(2)}) may not be optimal for Instagram`);
    }

    if (errors.length > 0) {
      throw new Error(`Video validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Generate thumbnail from video
   */
  private async generateThumbnail(filePath: string, metadata: VideoMetadata): Promise<string> {
    const thumbnailDir = path.join(path.dirname(filePath), 'thumbnails');
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    const thumbnailPath = path.join(thumbnailDir, `${path.basename(filePath, path.extname(filePath))}_thumb.jpg`);

    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .screenshots({
          timestamps: ['50%'], // Take screenshot at 50% of video duration
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '1080x1080', // Instagram-optimized size
        })
        .on('end', () => {
          logger.info(`Thumbnail generated: ${thumbnailPath}`);
          resolve(thumbnailPath);
        })
        .on('error', (err) => {
          reject(new Error(`Thumbnail generation failed: ${err.message}`));
        });
    });
  }

  /**
   * Compress video for better upload performance
   */
  private async compressVideo(filePath: string, metadata: VideoMetadata): Promise<string> {
    const compressedDir = path.join(path.dirname(filePath), 'compressed');
    if (!fs.existsSync(compressedDir)) {
      fs.mkdirSync(compressedDir, { recursive: true });
    }

    const compressedPath = path.join(compressedDir, `${path.basename(filePath, path.extname(filePath))}_compressed.mp4`);

    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('1080x1080') // Instagram-optimized size
        .videoBitrate('2000k')
        .audioBitrate('128k')
        .fps(30)
        .output(compressedPath)
        .on('end', () => {
          logger.info(`Video compressed: ${compressedPath}`);
          resolve(compressedPath);
        })
        .on('error', (err) => {
          reject(new Error(`Video compression failed: ${err.message}`));
        });
    });
  }

  /**
   * Get optimal video settings for Instagram
   */
  getInstagramVideoSettings(): {
    maxDuration: number;
    maxFileSize: number;
    recommendedDimensions: { width: number; height: number };
    recommendedBitrate: number;
  } {
    return {
      maxDuration: 60, // 60 seconds for Instagram feed
      maxFileSize: 100, // 100MB max file size
      recommendedDimensions: { width: 1080, height: 1080 },
      recommendedBitrate: 2000, // 2Mbps
    };
  }

  /**
   * Update video metadata in database
   */
  async updateVideoMetadata(videoId: string, metadata: VideoMetadata, thumbnailPath?: string): Promise<void> {
    try {
      await this.videoModel.findByIdAndUpdate(videoId, {
        thumbnailPath,
      });
      logger.info(`Updated video metadata for video: ${videoId}`);
    } catch (error) {
      logger.error('Failed to update video metadata:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.info(`Cleaned up temp file: ${filePath}`);
        }
      } catch (error) {
        logger.warn(`Failed to cleanup temp file ${filePath}:`, error);
      }
    }
  }

  /**
   * Get video processing statistics
   */
  async getProcessingStats(): Promise<{
    totalProcessed: number;
    averageProcessingTime: number;
    successRate: number;
    totalSize: number;
  }> {
    try {
      const result = await this.videoModel.aggregate([
        { $group: { _id: null, count: { $sum: 1 }, totalSize: { $sum: '$fileSize' } } }
      ]);
              return {
          totalProcessed: result[0]?.count || 0,
        averageProcessingTime: 0, // Would need to track processing times
        successRate: 1.0, // Would need to track failures
        totalSize: 0, // result.totalSize || 0,
      };
    } catch (error) {
      logger.error('Failed to get processing stats:', error);
      throw error;
    }
  }
}

export default VideoProcessingService; 