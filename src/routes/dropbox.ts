import { Router } from 'express';
import { listDropboxVideos } from '../lib/dropbox/listVideos';
import { downloadDropboxVideo } from '../lib/dropbox/downloadVideo';
import { uploadToS3 } from '../lib/upload/uploadToS3';

const router = Router();

router.post('/sync', async (req, res) => {
  try {
    const videos = await listDropboxVideos();
    const uploads = [];

    for (const video of videos) {
      const buffer = await downloadDropboxVideo(video.path_lower!);
      const uploadResult = await uploadToS3(Buffer.from(buffer), video.name, 'video/mp4');
      uploads.push(uploadResult);
    }

    res.status(200).json({ message: 'Synced from Dropbox', count: uploads.length });
  } catch (err) {
    console.error('Dropbox sync failed:', err);
    res.status(500).json({ error: 'Failed to sync from Dropbox' });
  }
});

export default router; 