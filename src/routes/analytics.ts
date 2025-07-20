import { Router } from 'express';
import { logPostAnalytics } from '../lib/analytics/postLogger';

const router = Router();

router.post('/log', async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { videoId, caption, views } = req.body;

  if (!caption || typeof views !== 'number') {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    await logPostAnalytics(videoId, caption, views);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Analytics logging failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router; 