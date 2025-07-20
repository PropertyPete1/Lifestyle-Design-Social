import { Router } from 'express';
import { tryPostingWithRetries } from '../lib/posting/retryLogic';

const router = Router();

router.post('/post', async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { videoId, caption, fileUrl } = req.body;
  if (!videoId || !caption || !fileUrl) return res.status(400).json({ error: 'Missing params' });

  const posted = await tryPostingWithRetries(videoId, caption, fileUrl);
  if (!posted) return res.status(500).json({ error: 'Post failed after retries' });

  res.status(200).json({ success: true });
});

export default router; 