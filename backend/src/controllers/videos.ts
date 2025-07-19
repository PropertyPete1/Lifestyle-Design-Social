import { postVideoToPlatform } from '../services/videoPostService';
import { Request, Response } from 'express';

export async function postVideoHandler(req: Request, res: Response) {
  const result = await postVideoToPlatform(req.body);
  res.json(result);
} 