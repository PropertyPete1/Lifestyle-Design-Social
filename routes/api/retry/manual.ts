import express from 'express';
import { retryFailedPost } from '../../../utils/retry/retryFailedPost';

const router = express.Router();

router.post('/manual', async (req, res) => {
  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({ error: 'Missing postId' });
  }

  const success = await retryFailedPost(postId);

  res.json({ success });
});

export default router; 