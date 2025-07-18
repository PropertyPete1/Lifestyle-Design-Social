import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const client = await clientPromise;
      const db = client.db();
      const newVideo = req.body;

      const result = await db.collection('videos').insertOne(newVideo);
      res.status(201).json({ insertedId: result.insertedId });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create video' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 