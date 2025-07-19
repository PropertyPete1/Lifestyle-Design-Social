// pages/api/caption/save.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongo';
import { VideoModel } from '@/lib/db/videoModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { videoId, caption } = req.body;

  if (!videoId || !caption) {
    return res.status(400).json({ message: 'Missing videoId or caption' });
  }

  try {
    await connectToDatabase();

    const updated = await VideoModel.findByIdAndUpdate(
      videoId,
      { $set: { aiCaption: caption } },
      { new: true, upsert: false }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Video not found' });
    }

    return res.status(200).json({ message: 'Caption saved', video: updated });
  } catch (error: any) {
    console.error('Error saving caption:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 