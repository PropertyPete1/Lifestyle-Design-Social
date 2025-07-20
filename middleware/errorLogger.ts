import { Request, Response, NextFunction } from 'express';
import { sendAlertEmail } from '../utils/email/sendAlertEmail';
import * as Sentry from '@sentry/node';

export function errorLogger(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack);
  
  // Capture error in Sentry
  Sentry.captureException(err, {
    tags: { component: 'errorLogger', path: req.path, method: req.method },
    extra: { 
      url: req.url, 
      headers: req.headers, 
      body: req.body,
      stack: err.stack 
    }
  });

  // Send alert email
  try {
    sendAlertEmail('Server Error Occurred', err.stack || 'Unknown Error');
  } catch (emailErr) {
    Sentry.captureException(emailErr, {
      tags: { component: 'errorLogger', subComponent: 'sendAlertEmail' },
      extra: { originalError: err.message }
    });
  }

  res.status(500).json({ error: 'Something went wrong' });
} 