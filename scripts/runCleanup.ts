import { runScheduledCleanup } from '../src/lib/cleanup/cleanupCron';

runScheduledCleanup().then(() => {
  console.log('Cleanup run complete.');
  process.exit(0);
}).catch((err) => {
  console.error('Error running cleanup:', err);
  process.exit(1);
}); 