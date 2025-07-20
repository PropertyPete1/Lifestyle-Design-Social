import cron from 'node-cron';
import { retryFailedPost } from '../../utils/retry/retryFailedPost';
import { getFailedPosts, updateRetryCount } from '../../src/lib/db/postQueue';
import * as Sentry from '@sentry/node';

cron.schedule('*/15 * * * *', async () => {
  try {
    console.log('[CRON] Retrying failed posts...');
    const failedPosts = await getFailedPosts();

    for (const post of failedPosts) {
      try {
        const success = await retryFailedPost(post.id);
        if (!success) {
          await updateRetryCount(post.id, post.retryCount + 1);
        }
      } catch (postErr) {
        Sentry.captureException(postErr, {
          tags: { component: 'postRetryJob', postId: post.id },
          extra: { postId: post.id, retryCount: post.retryCount }
        });
      }
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'postRetryJob' },
      extra: { job: 'postRetryJob', schedule: '*/15 * * * *' }
    });
  }
}); 