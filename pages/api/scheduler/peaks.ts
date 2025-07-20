import type { NextApiRequest, NextApiResponse } from 'next';
import { getPeakHoursForUser } from '../../../src/scheduler/peakHoursAnalyzer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter.' });
    }
    const peaks = await getPeakHoursForUser(userId);
    res.status(200).json({ peakHours: peaks });
  } catch (err) {
    console.error('Error calculating peak hours:', err);
    res.status(500).json({ error: 'Failed to calculate peak hours.' });
  }
} 