import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
// Import our centralized Sentry configuration
import './sentry';
import * as Sentry from '@sentry/node';

// Import routes
import captionsRouter from './routes/captions';
import hashtagsRouter from './routes/hashtags';
import cleanupRouter from './routes/cleanup';
import storageRouter from './routes/storage';
import cartoonRouter from './routes/cartoon';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/captions', captionsRouter);
app.use('/api/hashtags', hashtagsRouter);
app.use('/api/cleanup', cleanupRouter);
app.use('/api/storage', storageRouter);
app.use('/api/cartoon', cartoonRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// Basic API routes
app.get('/api', (_req, res) => {
  res.json({ 
    message: 'Auto-Posting App API',
    version: '1.0.0',
    status: 'running'
  });
});

// Test route to trigger a Sentry error
app.get('/api/test-error', (_req, res) => {
  try {
    throw new Error('This is a test error for Sentry!');
  } catch (err) {
    Sentry.captureException(err);
    res.status(500).send('Captured by Sentry');
  }
});

// ✅ Sentry test route for backend verification
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

// Sample route demonstrating manual Sentry logging
app.get('/api/test-logging', (_req, res) => {
  // Log different types of messages
  Sentry.captureMessage('API call received', { 
    level: 'info',
    tags: { route: '/api/test-logging' }
  });
  
  Sentry.captureException(new Error('Sample exception for testing'));
  
  Sentry.captureMessage('This is a fatal error message', { level: 'fatal' });
  
  res.json({ 
    message: 'Manual logging test completed',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env['NODE_ENV'] === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
}); 