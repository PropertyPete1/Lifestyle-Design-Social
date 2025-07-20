import { Request, Response, NextFunction } from 'express';
import { sendAlertEmail } from '../utils/email/sendAlertEmail';

export function errorLogger(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack);

  sendAlertEmail('Server Error Occurred', err.stack || 'Unknown Error');

  res.status(500).json({ error: 'Something went wrong' });
} 