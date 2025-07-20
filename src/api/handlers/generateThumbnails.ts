import { generateThumbnail } from '../../lib/videos/thumbnailGenerator';

export async function generateThumbnails(videoList: { videoId: string; path: string }[]) {
  for (const { videoId, path } of videoList) {
    try {
      const result = await generateThumbnail(path, videoId);
      console.log(`✅ Thumbnail for ${videoId}: ${result}`);
    } catch (err) {
      console.error(`❌ Failed thumbnail for ${videoId}:`, err);
    }
  }
} 