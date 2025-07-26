import { Router } from 'express';

const router = Router();

/**
 * GET /api/insights-simple/test
 * Simple test endpoint
 */
router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Insights route is working!',
    timestamp: new Date().toISOString()
  });
});

export default router; 