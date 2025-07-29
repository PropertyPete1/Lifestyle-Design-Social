import express from 'express';
import uploadRouter from './api/upload';
import instagramRouter from './api/instagram';
import youtubeRouter from './api/youtube';
import settingsRouter from './api/settings';
import insightsRouter from './api/insights';
import insightsSimpleRouter from './api/insights-simple';
import audioRouter from './api/audio';
import peakHoursRouter from './api/peakHours';
import repostRouter from './api/repost';
import finalPolishRouter from './api/finalPolish';
import youtubeOAuthRouter from './youtube/oauth';

const router = express.Router();

router.use('/upload', uploadRouter);
router.use('/instagram', instagramRouter);
router.use('/youtube', youtubeRouter);
router.use('/youtube/oauth', youtubeOAuthRouter);
router.use('/settings', settingsRouter);
router.use('/insights', insightsRouter);
router.use('/insights-simple', insightsSimpleRouter);
router.use('/audio', audioRouter);
router.use('/peak-hours', peakHoursRouter);
router.use('/repost', repostRouter);
router.use('/final-polish', finalPolishRouter);

export default router;
