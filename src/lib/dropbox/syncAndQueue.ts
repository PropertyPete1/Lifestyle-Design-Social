import { listDropboxVideos } from './listVideos';
import { downloadDropboxVideo } from './downloadVideo';
import { uploadToS3 } from '../upload/uploadToS3';
import { enqueueVideo } from '../scheduler/queueManager';
import * as Sentry from '@sentry/node';

export async function syncDropboxAndQueue() {
  try {
    const videos = await listDropboxVideos();
    for (const video of videos) {
      try {
        const buffer = await downloadDropboxVideo(video.path_lower!);
        const uploadResult = await uploadToS3(Buffer.from(buffer), video.name, 'video/mp4');
        await enqueueVideo({
          title: video.name,
          url: uploadResult,
          type: 'user',
        });
      } catch (videoErr) {
        Sentry.captureException(videoErr, {
          tags: { component: 'syncDropboxAndQueue', videoName: video.name },
          extra: { videoPath: video.path_lower, videoName: video.name }
        });
      }
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'syncDropboxAndQueue', operation: 'listVideos' }
    });
    throw err;
  }
} 