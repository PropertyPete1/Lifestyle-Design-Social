import { Request, Response, NextFunction } from 'express';

export function loggerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
} 