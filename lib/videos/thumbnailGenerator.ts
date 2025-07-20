import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { uploadToS3 } from '../upload/uploadToS3';

export async function generateThumbnail(videoPath: string, videoId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const thumbnailPath = path.join('/tmp', `${videoId}-thumbnail.jpg`);
    const command = `ffmpeg -i "${videoPath}" -ss 00:00:01.000 -vframes 1 "${thumbnailPath}"`;

    exec(command, async (error) => {
      if (error) return reject(error);

      try {
        const s3Url = await uploadToS3(thumbnailPath, `thumbnails/${videoId}.jpg`);
        fs.unlinkSync(thumbnailPath); // Clean up temp file
        resolve(s3Url);
      } catch (uploadError) {
        reject(uploadError);
      }
    });
  });
} 