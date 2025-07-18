import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/db/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const posts = await db
      .collection('youtube_posts')
      .find({})
      .sort({ publishedAt: -1 })
      .limit(50)
      .toArray();

    return res.status(200).json({ posts });
  } catch (error) {
    console.error('Error fetching YouTube posts:', error);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
} 