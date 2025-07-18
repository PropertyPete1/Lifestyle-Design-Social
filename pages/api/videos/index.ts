import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db();

  if (req.method === 'GET') {
    const videos = await db.collection('videos').find({}).toArray();
    res.status(200).json(videos);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 