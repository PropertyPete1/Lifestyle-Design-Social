import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/db/connect';
import Analytics from '@/lib/db/models/analytics';
import { authMiddleware } from '@/lib/auth/middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  await authMiddleware(req, res);

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, videoId } = req.query;

  const query: any = {};
  if (userId) query.userId = userId;
  if (videoId) query.videoId = videoId;

  try {
    const analytics = await Analytics.find(query).sort({ postedAt: -1 });
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
} 