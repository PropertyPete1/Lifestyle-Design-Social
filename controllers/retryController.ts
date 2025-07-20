import { Request, Response } from 'express';
import { retryFailedPost } from '../utils/retry/retryFailedPost';
import * as Sentry from '@sentry/node';

export async function manualRetry(req: Request, res: Response) {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'Missing postId' });
    }

    const success = await retryFailedPost(postId);

    res.json({ success });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'retryController', endpoint: 'manualRetry' },
      extra: { postId: req.body.postId, body: req.body }
    });
    res.status(500).json({ error: 'Internal server error' });
  }
} 