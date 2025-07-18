import type { NextApiRequest, NextApiResponse } from 'next';
import { publishInstagramVideo } from '@/lib/instagram/publish';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const result = await publishInstagramVideo(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Instagram publish failed' });
  }
} 