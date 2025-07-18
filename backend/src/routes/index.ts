import express from 'express';
import analyticsRoutes from './analytics';
import healthRoutes from './health';

const router = express.Router();

router.use('/analytics', analyticsRoutes);
router.use('/health', healthRoutes);

export default router; 