import express from 'express';
import uploadRouter from './api/upload';
import instagramRouter from './api/instagram';
import youtubeRouter from './api/youtube';

const router = express.Router();

router.use('/upload', uploadRouter);
router.use('/instagram', instagramRouter);
router.use('/youtube', youtubeRouter);

export default router;
