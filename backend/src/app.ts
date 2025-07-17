import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

import mongoose from 'mongoose';
import { logger } from './utils/logger';
import { connectToDatabase } from './config/database';

// Middleware imports
import { authenticateToken as authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Route imports
import analyticsRoutes from './routes/analytics';
import authRoutes from './routes/auth';
import autoPostRoutes from './routes/autoPost';
import captionsRoutes from './routes/captions';
import healthRoutes from './routes/health';
import instagramRoutes from './routes/instagram';
import instagramLearningRoutes from './routes/instagramLearning';
import notificationsRoutes from './routes/notifications';
import oauthRoutes from './routes/oauth';
import postsRoutes from './routes/posts';
import settingsRoutes from './routes/settings';
import videosRoutes from './routes/videos';

const app = express();
const PORT = process.env.PORT || 5001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Apply rate limiting to all requests
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    query: req.query,
  });
  next();
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/autopost', autoPostRoutes); // Some autopost routes are public for demo

// Protected routes (require authentication)
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/captions', authMiddleware, captionsRoutes);
app.use('/api/instagram', authMiddleware, instagramRoutes);
app.use('/api/instagram-learning', authMiddleware, instagramLearningRoutes);
app.use('/api/notifications', authMiddleware, notificationsRoutes);
app.use('/api/posts', authMiddleware, postsRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/videos', authMiddleware, videosRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    // Close database connections
    await mongoose.disconnect();
    logger.info('Database connection closed');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectToDatabase();
    logger.info('Database connected successfully');

    // Ensure upload directories exist
    const uploadDirs = [
      path.join(__dirname, '../uploads'),
      path.join(__dirname, '../uploads/videos'),
      path.join(__dirname, '../uploads/videos/thumbnails'),
      path.join(__dirname, '../uploads/videos/compressed'),
      path.join(__dirname, '../uploads/watermarked'),
      path.join(__dirname, '../uploads/watermarks'),
    ];

    uploadDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    });

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API available at: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

startServer();

export default app; 