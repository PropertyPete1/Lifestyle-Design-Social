import { postToInstagram, PostResult } from "./instagramPublisher";
import * as Sentry from '@sentry/node';

const MAX_RETRIES = 3;

export async function retryPost(video: any, caption: string, maxRetries = 3): Promise<PostResult> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await postToInstagram(video.url, caption);
    if (result.success) return result;
    await new Promise((r) => setTimeout(r, 1500)); // wait 1.5s
  }

  return { success: false, error: "Max retries reached." };
}

export async function tryPostingWithRetries(videoId: string, caption: string, fileUrl: string): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await postToInstagram(fileUrl, caption);
      if (result.success) return true;
    } catch (err) {
      console.error(`Attempt ${attempt} failed for video ${videoId}:`, err);
    }
  }

  Sentry.captureException(new Error(`All retries failed for video ${videoId}`));
  return false;
} 