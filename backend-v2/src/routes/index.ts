import express from 'express';
import settingsRouter from './api/settings';
import instagramRouter from './api/instagram';
import youtubeRouter from './api/youtube';
import phase9Router from './api/phase9';
import audioRouter from './api/audio';
import autopilotRouter from './api/autopilot';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'backend-v2',
    timestamp: new Date().toISOString() 
  });
});

// Settings routes
router.use('/settings', settingsRouter);

// Analytics routes
router.use('/instagram', instagramRouter);
router.use('/youtube', youtubeRouter);

// Phase 9 Autopilot routes
router.use('/phase9', phase9Router);

// Audio routes
router.use('/audio', audioRouter);

// Autopilot routes
router.use('/autopilot', autopilotRouter);

export default router;