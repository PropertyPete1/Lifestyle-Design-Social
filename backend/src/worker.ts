import { connectToMongo } from './config/database';
import { autoScheduleNextBatch } from './services/schedulingStrategy';
import { processNextScheduledVideo } from './services/schedulerService';

(async () => {
  await connectToMongo();

  const now = new Date();
  const isMorningRun = now.getHours() < 10;

  if (isMorningRun) {
    console.log('[📆] Running daily scheduling worker...');
    await autoScheduleNextBatch();
  } else {
    console.log('[🚀] Checking for next scheduled video to post...');
    await processNextScheduledVideo();
  }

  process.exit(0);
})();
