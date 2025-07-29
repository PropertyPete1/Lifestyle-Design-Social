import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Phase 9 Visual Enhancement Module
 * Enhances video quality before reposting to both platforms
 */
export class VideoQualityEnhancer {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(__dirname, '../../../temp_processing');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Main video enhancement function for Phase 9
   * 🔆 Auto-increase brightness by +15%
   * 🔆 Slight contrast enhancement + sharpen filter  
   * 🔆 Normalize color tones to remove yellow/green cast
   * 🔆 Export in 1080x1920 or original aspect ratio, whichever is taller
   */
  async enhanceVideoQuality(videoBuffer: Buffer): Promise<Buffer> {
    const tempId = crypto.randomBytes(8).toString('hex');
    const inputPath = path.join(this.tempDir, `input_${tempId}.mp4`);
    const outputPath = path.join(this.tempDir, `enhanced_${tempId}.mp4`);

    try {
      console.log('🔆 Phase 9: Starting video quality enhancement...');

      // Write buffer to temporary file
      fs.writeFileSync(inputPath, videoBuffer);

      // Apply comprehensive video enhancement
      await this.applyVideoEnhancements(inputPath, outputPath);

      // Read enhanced video back to buffer
      const enhancedBuffer = fs.readFileSync(outputPath);
      
      console.log(`✅ Video enhancement complete - size: ${Math.round(enhancedBuffer.length / 1024)}KB`);
      
      return enhancedBuffer;

    } catch (error) {
      console.error('❌ Video enhancement failed:', error);
      throw error;
    } finally {
      // Cleanup temporary files
      this.cleanupTempFiles([inputPath, outputPath]);
    }
  }

  /**
   * Apply comprehensive video enhancements using FFmpeg
   */
  private async applyVideoEnhancements(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const enhancement = ffmpeg(inputPath)
        .videoFilters([
          // Brightness enhancement (+15%)
          'eq=brightness=0.15:contrast=1.1:saturation=1.05',
          
          // Color correction to remove yellow/green cast
          'colorbalance=rm=0.1:gm=-0.1:bm=0.05',
          
          // Sharpen filter for crisp details
          'unsharp=5:5:1.0:5:5:0.3',
          
          // Normalize colors for consistency
          'curves=vintage',
          
          // Ensure optimal resolution (prefer taller aspect ratios)
          'scale=if(gt(iw/ih\\,9/16)\\,ih*9/16\\,iw):if(gt(iw/ih\\,9/16)\\,ih\\,iw*16/9)',
          'scale=min(1080\\,iw):min(1920\\,ih):force_original_aspect_ratio=decrease:force_divisible_by=2'
        ])
        .videoCodec('libx264')
        .outputOptions([
          '-crf', '20', // High quality compression
          '-preset', 'medium', // Balanced encoding speed/quality
          '-profile:v', 'high', // H.264 high profile
          '-level', '4.1', // Compatibility level
          '-pix_fmt', 'yuv420p', // Standard pixel format
          '-movflags', '+faststart' // Optimize for streaming
        ])
        .on('start', (commandLine: string) => {
          console.log('🎬 FFmpeg enhancement started:', commandLine.substring(0, 100) + '...');
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`   🔄 Enhancement progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ Video enhancement completed successfully');
          resolve();
        })
        .on('error', (err: Error) => {
          console.error('❌ FFmpeg enhancement error:', err.message);
          reject(err);
        });

      enhancement.save(outputPath);
    });
  }

  /**
   * Enhanced video processing with quality analysis
   */
  async enhanceVideoWithAnalysis(videoBuffer: Buffer): Promise<{
    enhancedVideo: Buffer;
    originalSize: number;
    enhancedSize: number;
    qualityImprovement: string;
  }> {
    const originalSize = videoBuffer.length;
    console.log(`📊 Original video size: ${Math.round(originalSize / 1024)}KB`);

    const enhancedVideo = await this.enhanceVideoQuality(videoBuffer);
    const enhancedSize = enhancedVideo.length;

    const sizeChange = ((enhancedSize - originalSize) / originalSize) * 100;
    const qualityImprovement = sizeChange > 0 
      ? `+${Math.round(sizeChange)}% (enhanced quality)`
      : `${Math.round(sizeChange)}% (optimized compression)`;

    console.log(`📈 Enhancement result: ${qualityImprovement}`);

    return {
      enhancedVideo,
      originalSize,
      enhancedSize,
      qualityImprovement
    };
  }

  /**
   * Batch enhance multiple videos
   */
  async enhanceVideoBatch(videoBuffers: Buffer[]): Promise<Buffer[]> {
    console.log(`🔄 Starting batch enhancement of ${videoBuffers.length} videos...`);
    
    const enhancedVideos: Buffer[] = [];
    
    for (let i = 0; i < videoBuffers.length; i++) {
      console.log(`📹 Processing video ${i + 1}/${videoBuffers.length}...`);
      
      try {
        const enhanced = await this.enhanceVideoQuality(videoBuffers[i]);
        enhancedVideos.push(enhanced);
      } catch (error) {
        console.error(`❌ Failed to enhance video ${i + 1}:`, error);
        // Include original video if enhancement fails
        enhancedVideos.push(videoBuffers[i]);
      }
    }

    console.log(`✅ Batch enhancement complete: ${enhancedVideos.length} videos processed`);
    return enhancedVideos;
  }

  /**
   * Get video metadata for quality analysis
   */
  async getVideoMetadata(videoBuffer: Buffer): Promise<{
    duration: number;
    resolution: { width: number; height: number };
    bitrate: number;
    format: string;
  }> {
    const tempId = crypto.randomBytes(8).toString('hex');
    const tempPath = path.join(this.tempDir, `metadata_${tempId}.mp4`);

    try {
      fs.writeFileSync(tempPath, videoBuffer);

      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(tempPath, (err, metadata) => {
          if (err) {
            reject(err);
            return;
          }

          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          if (!videoStream) {
            reject(new Error('No video stream found'));
            return;
          }

          resolve({
            duration: metadata.format.duration || 0,
            resolution: {
              width: videoStream.width || 0,
              height: videoStream.height || 0
            },
            bitrate: parseInt(String(metadata.format.bit_rate || '0')),
            format: metadata.format.format_name || 'unknown'
          });
        });
      });

    } finally {
      this.cleanupTempFiles([tempPath]);
    }
  }

  /**
   * Cleanup temporary files
   */
  private cleanupTempFiles(files: string[]): void {
    files.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.warn(`⚠️ Could not cleanup temp file ${file}:`, error);
      }
    });
  }

  /**
   * Validate video buffer before enhancement
   */
  validateVideoBuffer(videoBuffer: Buffer): { valid: boolean; error?: string } {
    if (!videoBuffer || videoBuffer.length === 0) {
      return { valid: false, error: 'Empty video buffer' };
    }

    if (videoBuffer.length < 1024) {
      return { valid: false, error: 'Video buffer too small' };
    }

    // Check for common video file signatures
    const signature = videoBuffer.subarray(0, 8).toString('hex');
    const isValidVideo = [
      '000000', // MP4
      '667479', // MP4 ftyp
      '1a45df', // MKV
      '464c56', // FLV
    ].some(sig => signature.includes(sig));

    if (!isValidVideo) {
      return { valid: false, error: 'Invalid video format' };
    }

    return { valid: true };
  }
}

// Export convenience function for Phase 9 integration
export async function enhanceVideoQuality(videoBuffer: Buffer): Promise<Buffer> {
  const enhancer = new VideoQualityEnhancer();
  return enhancer.enhanceVideoQuality(videoBuffer);
}

// Export enhanced function with analysis
export async function enhanceVideoWithAnalysis(videoBuffer: Buffer) {
  const enhancer = new VideoQualityEnhancer();
  return enhancer.enhanceVideoWithAnalysis(videoBuffer);
}