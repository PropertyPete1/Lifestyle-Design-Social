import { Request, Response } from 'express';
import { generateCaption, generateHashtags } from '../services/ai.service';

export const generateCaptionAndHashtags = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const caption = await generateCaption(title);
    const hashtags = await generateHashtags(title);
    res.status(200).json({ caption, hashtags });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate caption or hashtags' });
  }
}; 