import express from 'express';
import multer from 'multer';
import { uploadToS3 } from '../services/s3Service';
import { VideoModel } from '../models/Video';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No video provided.' });

    const s3Url = await uploadToS3(file);

    const newVideo = await VideoModel.create({
      filename: file.originalname,
      s3Url,
      status: 'draft',
      platform: null,
      caption: '',
    });

    res.json({ success: true, video: newVideo });
  } catch (err) {
    console.error('[UPLOAD ERROR]', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
