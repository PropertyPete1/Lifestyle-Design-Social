import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Import configuration
import { config } from './config';
import { initialize as initializeDatabase } from './config/database';
import { logger } from './utils/logger';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import postRoutes from './routes/posts';
import analyticsRoutes from './routes/analytics';
import healthRoutes from './routes/health';

// Load environment variables
dotenv.config();

class RealEstateAutoPostingApp {
  private app: Application;
  private server: any;

  constructor() {
    this.app = express();
    this.server = require('http').createServer(this.app);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Trust proxy for production
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-API-Key',
        'X-Request-ID',
      ],
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Static file serving
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    this.app.use('/public', express.static(path.join(__dirname, '../public')));
  }

  private setupRoutes(): void {
    // Health check (no auth required)
    this.app.use('/health', healthRoutes);
    this.app.use('/api/health', healthRoutes);

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/videos', videoRoutes);
    this.app.use('/api/posts', postRoutes);
    this.app.use('/api/analytics', analyticsRoutes);

    // API documentation
    if (config.nodeEnv === 'development') {
      this.app.get('/api/docs', (req: Request, res: Response) => {
        res.json({
          message: 'Real Estate Auto-Posting API Documentation',
          version: '1.0.0',
          endpoints: {
            auth: '/api/auth',
            videos: '/api/videos',
            posts: '/api/posts',
            analytics: '/api/analytics',
            health: '/api/health',
          },
        });
      });
    }

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Real Estate Auto-Posting SaaS API',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      logger.error('Global error handler:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Don't leak error details in production
      const isDevelopment = config.nodeEnv === 'development';
      
      const response = {
        success: false,
        error: isDevelopment ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      };

      res.status(error.statusCode || 500).json(response);
    });
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      try {
        // Stop accepting new connections
        this.server.close(() => {
          logger.info('HTTP server closed');
        });

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  }

  public async start(): Promise<void> {
    try {
      logger.info('🚀 Starting Real Estate Auto-Posting SaaS Application...');

      // Initialize database
      await initializeDatabase();
      logger.info('✅ Database initialized');

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start server
      const port = config.port || 3001;
      this.server.listen(port, () => {
        logger.info(`🎉 Server running on port ${port}`);
        logger.info(`📊 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 Health check: http://localhost:${port}/health`);
        logger.info(`📚 API Documentation: http://localhost:${port}/api/docs`);
      });

    } catch (error) {
      logger.error('❌ Failed to start application:', error);
      process.exit(1);
    }
  }
}

// Export the app instance
export const app = new RealEstateAutoPostingApp();

// Start the application if this file is run directly
if (require.main === module) {
  app.start().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
} 