import { getAnalyticsSummary } from '../services/analyticsService';
import { Request, Response } from 'express';

export async function getAnalyticsSummaryHandler(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  const summary = await getAnalyticsSummary(userId);
  res.json(summary);
} 