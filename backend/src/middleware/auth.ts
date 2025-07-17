import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        userId: string;
        email?: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    userId: string;
    email?: string;
    iat?: number;
    exp?: number;
  };
}

// Generate JWT token
export const generateToken = (userId: string, email?: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required for production');
  }
  const payload = {
    userId,
    id: userId,
    email,
  };
  
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // Get token from header (support both x-auth-token and Authorization: Bearer)
  let token = req.header('x-auth-token');
  if (!token && req.header('authorization')) {
    const authHeader = req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Check if no token
  if (!token) {
    res.status(401).json({ error: 'No token, authorization denied' });
    return;
  }

  try {
    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required for production');
    }
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.user = {
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
    return;
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  let token = req.header('x-auth-token');
  if (!token && req.header('authorization')) {
    const authHeader = req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (token) {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is required for production');
      }
      const decoded = jwt.verify(token, jwtSecret) as any;
      req.user = {
        id: decoded.userId || decoded.id,
        userId: decoded.userId || decoded.id,
        email: decoded.email,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      // Ignore invalid tokens in optional auth
    }
  }
  
  next();
}; 