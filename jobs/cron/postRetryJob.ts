import cron from 'node-cron';
import { retryFailedPost } from '../../utils/retry/retryFailedPost';
import { getFailedPosts, updateRetryCount } from '../../src/lib/db/postQueue';

cron.schedule('*/15 * * * *', async () => {
  console.log('[CRON] Retrying failed posts...');
  const failedPosts = await getFailedPosts();

  for (const post of failedPosts) {
    const success = await retryFailedPost(post.id, post.retryCount + 1);
    if (!success) {
      await updateRetryCount(post.id, post.retryCount + 1);
    }
  }
}); 