import { getRetryDelay } from '../../utils/retry/utils';

export function scheduleRetry(postId: string, attempt: number) {
  const delay = getRetryDelay(attempt);
  setTimeout(() => {
    console.log(`⏱️ Retrying post ${postId} after ${delay}ms...`);
    // Place retry function call here if needed
  }, delay);
} 