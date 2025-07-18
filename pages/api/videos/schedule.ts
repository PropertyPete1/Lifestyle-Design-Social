import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getNextPostTimes } from '@/lib/utils/scheduler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const client = await clientPromise;
    const db = client.db();

    const videos = await db.collection('videos').find({}).toArray();
    const nextTimes = getNextPostTimes(videos);

    await Promise.all(
      videos.map((video, index) =>
        db.collection('videos').updateOne(
          { _id: video._id },
          { $set: { scheduledAt: nextTimes[index % nextTimes.length] } }
        )
      )
    );

    res.status(200).json({ message: 'Videos scheduled', nextTimes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Scheduling failed' });
  }
} 