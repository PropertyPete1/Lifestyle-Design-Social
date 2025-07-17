import { connectToDatabase } from './config/database';
import { logger } from './utils/logger';
import * as cron from 'node-cron';

// Import service classes (not default exports)
// const analyticsService = new AnalyticsService();

async function startWorker() {
  try {
    await connectToDatabase();
    logger.info('Worker started successfully');

    // Schedule jobs
    // Daily analytics at 6 AM
    cron.schedule('0 6 * * *', async () => {
      try {
        logger.info('Running daily analytics job');
        // Generate daily analytics reports
        // await analyticsService.generateDailyReport();
      } catch (error) {
        logger.error('Daily analytics job failed:', error);
      }
    });

    // Hourly maintenance at minute 0
    cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Running hourly maintenance');
        // Run maintenance tasks
        // await performMaintenanceTasks();
      } catch (error) {
        logger.error('Hourly maintenance failed:', error);
      }
    });

    logger.info('All scheduled jobs initialized');
  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Worker shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Worker terminating...');
  process.exit(0);
});

startWorker(); 