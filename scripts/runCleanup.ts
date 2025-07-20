import { runScheduledCleanup } from '../src/lib/cleanup/cleanupCron';
import * as Sentry from '@sentry/node';

runScheduledCleanup().then(() => {
  console.log('Cleanup run complete.');
  process.exit(0);
}).catch((err) => {
  console.error('Error running cleanup:', err);
  Sentry.captureException(err, {
    tags: { component: 'runCleanup' },
    extra: { script: 'runCleanup.ts' }
  });
  process.exit(1);
}); 