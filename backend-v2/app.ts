import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import { appConfig } from './src/config/environment';
import { connectToDatabase } from './src/database/connection';
import { autopilotScheduler } from './src/services/autopilotScheduler';
import indexRouter from './src/routes/index';

const app = express();

// CORS configuration for frontend-v2
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = appConfig.get('corsOrigins');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight OPTIONS requests
app.options('*', cors({
  origin: (origin, callback) => {
    const allowedOrigins = appConfig.get('corsOrigins');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware setup
app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());

// Routes
app.use('/api', indexRouter);

// Serve temporary files for Instagram uploads
app.use('/temp', express.static('temp', {
  maxAge: '1h', // Cache for 1 hour
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
  }
}));

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', error);
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
      status: error.status || 500
    }
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      status: 404,
      path: req.path
    }
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    
    // Start autopilot scheduler
    console.log('⏰ Starting autopilot scheduler...');
    autopilotScheduler.start();
    
    // Start server
    const port = appConfig.get('port');
    app.listen(port, () => {
      console.log('🚀 Backend-v2 server started');
      console.log(`📡 Server running on port ${port}`);
      console.log(`🌐 Environment: ${appConfig.get('nodeEnv')}`);
      console.log('✅ Ready to serve frontend-v2!');
      console.log('🤖 Autopilot scheduler is running');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  autopilotScheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  autopilotScheduler.stop();
  process.exit(0);
});

// Start the server
startServer();

export default app;