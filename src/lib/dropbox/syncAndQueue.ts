import { listDropboxVideos } from './listVideos';
import { downloadDropboxVideo } from './downloadVideo';
import { uploadToS3 } from '../upload/uploadToS3';
import { enqueueVideo } from '../scheduler/queueManager';

export async function syncDropboxAndQueue() {
  const videos = await listDropboxVideos();
  for (const video of videos) {
    const buffer = await downloadDropboxVideo(video.path_lower!);
    const uploadResult = await uploadToS3(Buffer.from(buffer), video.name, 'video/mp4');
    await enqueueVideo({
      title: video.name,
      url: uploadResult,
      type: 'user',
    });
  }
} 