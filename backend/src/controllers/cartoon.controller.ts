import { Request, Response } from 'express';
import { generateCartoonVideo } from '../services/cartoon.service';

export const createCartoon = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const cartoonUrl = await generateCartoonVideo(prompt);
    res.status(200).json({ url: cartoonUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate cartoon video' });
  }
}; 