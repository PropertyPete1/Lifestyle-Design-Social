import express from 'express';

import authRoutes from './auth.routes';
import videoRoutes from './video.routes';
import captionRoutes from './caption.routes';
import cartoonRoutes from './cartoon.routes';
import analyticsRoutes from './analytics';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/videos', videoRoutes);
router.use('/captions', captionRoutes);
router.use('/cartoons', cartoonRoutes);
router.use('/analytics', analyticsRoutes);

export default router; 