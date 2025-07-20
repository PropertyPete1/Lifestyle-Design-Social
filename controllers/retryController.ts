import { Request, Response } from 'express';
import { retryFailedPost } from '../utils/retry/retryFailedPost';

export async function manualRetry(req: Request, res: Response) {
  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({ error: 'Missing postId' });
  }

  const success = await retryFailedPost(postId);

  res.json({ success });
} 