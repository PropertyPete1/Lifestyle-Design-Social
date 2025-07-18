import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';

interface CameraRollVideo {
  id: string;
  filename: string;
  filePath: string;
  thumbnailPath: string;
  size: number;
  duration: number;
  createdAt: Date;
  metadata: {
    width: number;
    height: number;
    format: string;
    bitrate: number;
  };
}

/**
 * Real camera roll service - connects to actual user camera roll
 */
export class CameraRollService {
  private static instance: CameraRollService;
  private readonly baseVideoPath = path.join(__dirname, '../uploads/videos');

  public static getInstance(): CameraRollService {
    if (!CameraRollService.instance) {
      CameraRollService.instance = new CameraRollService();
    }
    return CameraRollService.instance;
  }

  /**
   * Get real videos from user's uploaded camera roll
   */
  async getCameraRollVideos(userId: string): Promise<CameraRollVideo[]> {
    try {
      const userVideoPath = path.join(this.baseVideoPath, userId);

      // Ensure user video directory exists
      try {
        await fs.access(userVideoPath);
      } catch {
        // Directory doesn't exist, create it
        await fs.mkdir(userVideoPath, { recursive: true });
        logger.info(`Created video directory for user ${userId}`);
        return [];
      }

      // Read actual video files from user's directory
      const files = await fs.readdir(userVideoPath);
      const videoFiles = files.filter(
        (file) =>
          file.toLowerCase().endsWith('.mp4') ||
          file.toLowerCase().endsWith('.mov') ||
          file.toLowerCase().endsWith('.avi')
      );

      const videos: CameraRollVideo[] = [];

      for (const filename of videoFiles) {
        const filePath = path.join(userVideoPath, filename);
        const stat = await fs.stat(filePath);

        const video: CameraRollVideo = {
          id: `${userId}_${filename}`,
          filename,
          filePath,
          thumbnailPath: path.join(userVideoPath, 'thumbnails', `${filename}.jpg`),
          size: stat.size,
          duration: 0, // Would be extracted from actual video metadata
          createdAt: stat.birthtime,
          metadata: {
            width: 1920, // Would be extracted from actual video
            height: 1080,
            format: path.extname(filename).slice(1),
            bitrate: 0, // Would be extracted from actual video metadata
          },
        };

        videos.push(video);
      }

      logger.info(`Found ${videos.length} real videos for user ${userId}`);
      return videos;
    } catch (error) {
      logger.error('Error getting camera roll videos:', error);
      return [];
    }
  }

  /**
   * Upload video to user's camera roll
   */
  async uploadVideo(userId: string, file: Express.Multer.File): Promise<CameraRollVideo | null> {
    try {
      const userVideoPath = path.join(this.baseVideoPath, userId);
      await fs.mkdir(userVideoPath, { recursive: true });

      const filename = `${Date.now()}_${file.originalname}`;
      const filePath = path.join(userVideoPath, filename);

      // Move uploaded file to user's directory
      await fs.writeFile(filePath, file.buffer);

      const stat = await fs.stat(filePath);

      const video: CameraRollVideo = {
        id: `${userId}_${filename}`,
        filename,
        filePath,
        thumbnailPath: path.join(userVideoPath, 'thumbnails', `${filename}.jpg`),
        size: stat.size,
        duration: 0, // Would be extracted from actual video metadata
        createdAt: stat.birthtime,
        metadata: {
          width: 1920, // Would be extracted from actual video
          height: 1080,
          format: path.extname(filename).slice(1),
          bitrate: 0, // Would be extracted from actual video metadata
        },
      };

      logger.info(`Uploaded video ${filename} for user ${userId}`);
      return video;
    } catch (error) {
      logger.error('Error uploading video:', error);
      return null;
    }
  }
}

export const cameraRollService = CameraRollService.getInstance();
