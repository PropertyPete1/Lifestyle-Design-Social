import express from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        type: 'MongoDB'
      },
      memory: process.memoryUsage(),
      version: process.version
    };

    logger.info('Health check performed');
    
    return res.json(healthData);
  } catch (error) {
    logger.error('Health check failed:', error);
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

export default router; 