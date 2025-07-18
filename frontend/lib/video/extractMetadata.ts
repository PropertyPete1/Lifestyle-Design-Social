import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const ffprobe = promisify(ffmpeg.ffprobe);

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
}

export async function extractVideoMetadata(filePath: string): Promise<VideoMetadata> {
  const stats = await fs.promises.stat(filePath);
  const info = await ffprobe(filePath);

  const videoStream = info.streams.find((s) => s.codec_type === 'video');

  if (!videoStream || !videoStream.width || !videoStream.height) {
    throw new Error('Video stream info not found');
  }

  return {
    duration: info.format.duration ?? 0,
    width: videoStream.width,
    height: videoStream.height,
    size: stats.size,
    format: info.format.format_name ?? 'unknown',
  };
} 