import { Request, Response } from 'express';

export function statusCheck(_req: Request, res: Response) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
} 