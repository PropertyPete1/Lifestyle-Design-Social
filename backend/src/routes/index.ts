import express from 'express';
import uploadRouter from './api/upload';
import instagramRouter from './api/instagram';
import youtubeRouter from './api/youtube';
import settingsRouter from './api/settings';

const router = express.Router();

router.use('/upload', uploadRouter);
router.use('/instagram', instagramRouter);
router.use('/youtube', youtubeRouter);
router.use('/settings', settingsRouter);

export default router;
