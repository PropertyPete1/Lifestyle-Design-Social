import { logStatus } from '../logger';
import { sendAlertEmail } from '../email/sendAlertEmail';
import * as Sentry from '@sentry/node';

export async function retryFailedPost(postId: string): Promise<boolean> {
  let attempt = 0;
  let success = false;

  while (attempt < 3 && !success) {
    try {
      attempt++;
      logStatus(postId, `Retry attempt ${attempt}`);
      // TODO: Replace with actual retry logic for failed post
      success = Math.random() > 0.4;
      if (success) logStatus(postId, 'retry succeeded');
    } catch (err) {
      logStatus(postId, `retry error: ${err}`);
      Sentry.captureException(err, {
        tags: { postId, attempt, component: 'retryFailedPost' },
        extra: { postId, attempt }
      });
    }
  }

  if (!success) {
    try {
      await sendAlertEmail(
        `Post failed after 3 retries`,
        `Post with ID ${postId} failed after 3 attempts. Please investigate.`
      );
    } catch (emailErr) {
      Sentry.captureException(emailErr, {
        tags: { postId, component: 'sendAlertEmail' },
        extra: { postId, originalError: 'Post failed after 3 retries' }
      });
    }
  }

  return success;
} 