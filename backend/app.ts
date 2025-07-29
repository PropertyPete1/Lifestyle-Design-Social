import 'dotenv/config';
import { appConfig } from './src/config/environment';
import * as path from 'path';

// Now import everything else after settings are loaded
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import indexRouter from './src/routes/index';
import phase9Router from './src/routes/api/phase9';
import insightsRouter from './src/routes/api/insights';
import healthRouter from './src/routes/api/health';
import { initializeScheduledJobs } from './src/lib/youtube/schedulePostJob';
import { migrateFilePaths } from './src/lib/youtube/migrateFilePaths';
import { startDropboxMonitoring } from './src/services/dropboxMonitor';
import { repostMonitor } from './src/services/repostMonitor';
import { audioMatchingScheduler } from './src/services/audioMatchingScheduler';
import { peakHoursScheduler } from './src/lib/peakHours/scheduler';
import { smartRepostTrigger } from './src/lib/repost/smartRepostTrigger';
import { phase9Monitor } from './src/services/phase9Monitor';
import { dailyHashtagRefresh } from './src/services/dailyHashtagRefresh';
import { dailyScheduler } from './src/services/dailyScheduler';
import { dailyRepostScheduler } from './src/services/dailyRepostScheduler';

const app = express();

// CORS for all routes and preflight
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'http://localhost:3000' || origin === 'http://localhost:3001') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Explicitly handle preflight for all routes
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'http://localhost:3000' || origin === 'http://localhost:3001') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);
app.use('/api/health', healthRouter);
app.use('/api/phase9', phase9Router);
app.use('/api/insights', insightsRouter);

// Initialize all scheduled services
async function initializeServices() {
  try {
    console.log('🚀 Initializing backend services...');
    
    // Initialize database migration
    await migrateFilePaths();
    
    // Start scheduled jobs
    initializeScheduledJobs();
    
    // Start monitoring services
    startDropboxMonitoring();
    repostMonitor.startMonitoring();
    audioMatchingScheduler.start();
    peakHoursScheduler.startScheduler();
    // smartRepostTrigger starts automatically in constructor
    phase9Monitor.start();
    
    // Start daily hashtag refresh service
    dailyHashtagRefresh.start();
    
    // Initialize daily scheduler
    dailyScheduler.start().catch(console.error);
    
    // Start daily repost scheduler
    dailyRepostScheduler.start();
    
    // Start RepostQueue executor for scheduled posts
    const { repostQueueExecutor } = await import('./src/services/repostQueueExecutor');
    repostQueueExecutor.start();
    
    console.log('✅ All backend services initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing services:', error);
  }
}

// Run migration and initialize scheduled jobs on server start
(async () => {
  try {
    // Import here to avoid circular dependency
    const { connectToDatabase } = await import('./src/database/connection');
    
    // Connect to database first
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    
    // Initialize all services
    await initializeServices();
    
    console.log('🚀 Backend fully initialized with ALL PHASES (1-9) complete');
  } catch (error) {
    console.error('❌ Failed to initialize backend:', error);
  }
})();

export default app;
