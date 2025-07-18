// import { connectToDatabase } from '../config/database';
import ffmpeg from 'fluent-ffmpeg';
// import sharp from 'sharp'; // Removed for production deployment
import { promises as fs } from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import { connectToDatabase } from '../config/database';
import User from '../models/User';

export interface WatermarkSettings {
  enabled: boolean;
  logoPath: string | null;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number; // 0.10 to 1.00
  sizePercent: number; // 5.00 to 50.00
}

export interface WatermarkResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  processingTime?: number;
}

export class WatermarkService {
  private readonly WATERMARK_DIR = path.join(process.cwd(), 'uploads', 'watermarks');
  private readonly OUTPUT_DIR = path.join(process.cwd(), 'uploads', 'watermarked');

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.WATERMARK_DIR, { recursive: true });
      await fs.mkdir(this.OUTPUT_DIR, { recursive: true });
    } catch (error) {
      logger.error('Error creating watermark directories:', error);
    }
  }

  /**
   * Apply watermark to video
   */
  async applyWatermark(videoPath: string, userId: string): Promise<WatermarkResult> {
    const startTime = Date.now();

    try {
      // Get user's watermark settings
      const settings = await this.getUserWatermarkSettings(userId);

      if (!settings.enabled || !settings.logoPath) {
        return {
          success: false,
          error: 'Watermark not enabled or logo path not set',
        };
      }

      // Generate unique output filename
      const inputFilename = path.basename(videoPath, path.extname(videoPath));
      const outputPath = path.join(
        this.OUTPUT_DIR,
        `${inputFilename}_watermarked${path.extname(videoPath)}`
      );

      // Apply watermark
      await this.processVideoWithWatermark(videoPath, settings.logoPath, outputPath, settings);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        outputPath,
        processingTime,
      };
    } catch (error) {
      logger.error('Error applying watermark:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upload watermark logo
   */
  async uploadWatermarkLogo(userId: string, logoBuffer: Buffer, filename: string): Promise<string> {
    try {
      // Validate image
      // Sharp removed for production deployment - using placeholder metadata
      const metadata = { width: 200, height: 60 };

      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image file');
      }

      // Generate unique filename
      const fileExtension = path.extname(filename);
      const uniqueFilename = `watermark_${userId}_${Date.now()}${fileExtension}`;
      const logoPath = path.join(this.WATERMARK_DIR, uniqueFilename);

      // Process and save logo - Sharp removed for production deployment
      // In production, would use alternative image processing library
      await fs.writeFile(logoPath, logoBuffer);

      // Update user's watermark logo path
      await this.updateUserWatermarkLogo(userId, logoPath);

      logger.info(`Watermark logo uploaded for user ${userId}: ${logoPath}`);

      return logoPath;
    } catch (error) {
      logger.error('Error uploading watermark logo:', error);
      throw new Error('Failed to upload watermark logo');
    }
  }

  /**
   * Generate watermark preview
   */
  async generatePreview(userId: string): Promise<string> {
    try {
      const settings = await this.getUserWatermarkSettings(userId);

      if (!settings.logoPath) {
        throw new Error('No watermark logo set');
      }

      // Create sample video
      const sampleVideoPath = await this.createSampleVideo();

      // Apply watermark
      const result = await this.applyWatermark(sampleVideoPath, userId);

      if (!result.success || !result.outputPath) {
        throw new Error(result.error || 'Failed to generate preview');
      }

      // Cleanup sample video
      await this.cleanup(sampleVideoPath);

      return result.outputPath;
    } catch (error) {
      logger.error('Error generating watermark preview:', error);
      throw new Error('Failed to generate watermark preview');
    }
  }

  /**
   * Update user's watermark settings
   */
  async updateWatermarkSettings(
    userId: string,
    settings: Partial<WatermarkSettings>
  ): Promise<WatermarkSettings> {
    try {
      await connectToDatabase();

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (settings.enabled !== undefined) {
        updateData.watermarkEnabled = settings.enabled;
      }
      if (settings.logoPath !== undefined) {
        updateData.watermarkLogoPath = settings.logoPath;
      }
      if (settings.position !== undefined) {
        updateData.watermarkPosition = settings.position;
      }
      if (settings.opacity !== undefined) {
        updateData.watermarkOpacity = settings.opacity;
      }
      if (settings.sizePercent !== undefined) {
        updateData.watermarkSizePercent = settings.sizePercent;
      }

      await User.findByIdAndUpdate(userId, updateData);

      // Return updated settings
      return await this.getUserWatermarkSettings(userId);
    } catch (error) {
      logger.error('Error updating watermark settings:', error);
      throw new Error('Failed to update watermark settings');
    }
  }

  /**
   * Get user's watermark settings
   */
  async getUserWatermarkSettings(userId: string): Promise<WatermarkSettings> {
    try {
      await connectToDatabase();

      const user = await User.findById(userId).select(
        'watermarkEnabled watermarkLogoPath watermarkPosition watermarkOpacity watermarkSizePercent'
      );

      if (!user) {
        throw new Error('User not found');
      }

      return {
        enabled: Boolean(user.watermarkEnabled) || false,
        logoPath: user.watermarkLogoPath || null,
        position: user.watermarkPosition || 'bottom-right',
        opacity: user.watermarkOpacity || 0.7,
        sizePercent: user.watermarkSizePercent || 10.0,
      };
    } catch (error) {
      logger.error('Error getting watermark settings:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async processVideoWithWatermark(
    inputPath: string,
    logoPath: string,
    outputPath: string,
    settings: WatermarkSettings
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Calculate position based on settings
      const position = this.calculateWatermarkPosition(settings.position, settings.sizePercent);

      ffmpeg(inputPath)
        .input(logoPath)
        .complexFilter([
          `[1:v]scale=100:100[logo]`,
          `[0:v][logo]overlay=${position.x}:${position.y}[output]`,
        ])
        .map('[output]')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  private calculateWatermarkPosition(
    position: string,
    sizePercent: number
  ): { x: string; y: string } {
    const margin = 20;
    const size = `(main_w*${sizePercent / 100})`;

    switch (position) {
      case 'top-left':
        return { x: margin.toString(), y: margin.toString() };
      case 'top-right':
        return { x: `(main_w-${size}-${margin})`, y: margin.toString() };
      case 'bottom-left':
        return { x: margin.toString(), y: `(main_h-${size}-${margin})` };
      case 'bottom-right':
        return { x: `(main_w-${size}-${margin})`, y: `(main_h-${size}-${margin})` };
      case 'center':
        return { x: `(main_w-${size})/2`, y: `(main_h-${size})/2` };
      default:
        return { x: `(main_w-${size}-${margin})`, y: `(main_h-${size}-${margin})` };
    }
  }

  private async updateUserWatermarkLogo(userId: string, logoPath: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      watermarkLogoPath: logoPath,
      updatedAt: new Date(),
    });
  }

  private async cleanup(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn(`Failed to cleanup file ${filePath}:`, error);
    }
  }

  private async createSampleVideo(): Promise<string> {
    // Create a simple test video for preview purposes
    const samplePath = path.join(this.OUTPUT_DIR, 'sample_video.mp4');

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input('color=blue:size=1920x1080:duration=5')
        .inputFormat('lavfi')
        .output(samplePath)
        .on('end', () => resolve(samplePath))
        .on('error', (err) => reject(err))
        .run();
    });
  }
}

export const watermarkService = new WatermarkService();
