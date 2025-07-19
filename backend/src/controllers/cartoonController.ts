import { Request, Response } from 'express';
import {
  saveCartoonMetadata,
  getCartoonQueue,
  markCartoonAsPosted,
  deleteCartoonById,
} from '../services/cartoonService';

export async function createCartoon(req: Request, res: Response) {
  const metadata = req.body;
  const result = await saveCartoonMetadata(metadata);
  res.status(201).json(result);
}

export async function getCartoons(req: Request, res: Response): Promise<void> {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  const queue = await getCartoonQueue(userId);
  res.status(200).json(queue);
}

export async function markPosted(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }
  await markCartoonAsPosted(id);
  res.sendStatus(204);
}

export async function deleteCartoon(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }
  await deleteCartoonById(id);
  res.sendStatus(204);
} 