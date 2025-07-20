import ffmpeg from "fluent-ffmpeg";
import { generateThumbnail } from '../videos/thumbnailGenerator';
import fs from 'fs';
import path from 'path';

export function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

export async function processVideo(videoPath: string, filename: string) {
  try {
    // Ensure thumbnails directory exists
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    const outputPath = path.join(thumbnailsDir, `${filename}.jpg`);
    
    // Generate thumbnail
    await generateThumbnail(videoPath, outputPath);
    
    // Get video duration
    const duration = await getVideoDuration(videoPath);
    
    return {
      thumbnailPath: outputPath,
      thumbnailUrl: `/thumbnails/${filename}.jpg`,
      duration,
      filename
    };
  } catch (error) {
    console.error('Video processing failed:', error);
    throw new Error(`Failed to process video ${filename}: ${error}`);
  }
}

export async function processVideoBatch(videoFiles: Array<{ path: string; filename: string }>) {
  const results = [];
  
  for (const video of videoFiles) {
    try {
      const result = await processVideo(video.path, video.filename);
      results.push({ ...result, success: true });
    } catch (error) {
      console.error(`Failed to process ${video.filename}:`, error);
      results.push({ 
        filename: video.filename, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  return results;
} 