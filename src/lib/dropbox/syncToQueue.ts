import { listDropboxVideos } from './listVideos';
import { downloadDropboxVideo } from './downloadVideo';
import { uploadToS3 } from '../upload/uploadToS3';
import { addToQueue } from '../scheduler/videoQueue';

export async function syncDropboxToQueue() {
  const videos = await listDropboxVideos();
  for (const video of videos) {
    const buffer = await downloadDropboxVideo(video.path_lower!);
    const uploadResult = await uploadToS3(Buffer.from(buffer), video.name, 'video/mp4');
    await addToQueue(uploadResult, 'user');
  }
} 