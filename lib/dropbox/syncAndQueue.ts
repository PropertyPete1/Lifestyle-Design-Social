import { listDropboxVideos } from './listVideos';
import { downloadDropboxVideo } from './downloadVideo';
import { uploadToS3 } from '../upload/uploadToS3';

export async function syncDropboxAndQueue() {
  const videos = await listDropboxVideos();
  const results: any[] = [];
  
  for (const video of videos) {
    try {
      const buffer = await downloadDropboxVideo(video.path_lower!);
      const uploadResult = await uploadToS3(Buffer.from(buffer), video.name, 'video/mp4');
      results.push({
        filename: video.name,
        s3Url: uploadResult,
        source: 'dropbox',
        status: 'success'
      });
    } catch (error: any) {
      console.error(`Failed to process ${video.name}:`, error);
      results.push({
        filename: video.name,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return results;
} 