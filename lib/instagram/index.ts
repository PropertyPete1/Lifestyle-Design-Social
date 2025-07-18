import { InstagramPostPayload } from './types';
import { publishToInstagramReels } from './publish';
import { logInstagramPost } from '../db/logInstagramPost';

export async function handleInstagramPost(payload: InstagramPostPayload) {
  try {
    const result = await publishToInstagramReels(payload);

    // Log to DB
    await logInstagramPost({
      caption: payload.caption,
      videoUrl: payload.videoUrl,
      instagramPostId: result.id,
      publishedAt: new Date(),
    });

    return { success: true, instagramPostId: result.id };
  } catch (err: any) {
    console.error('Instagram post failed:', err.message);
    return { success: false, error: err.message };
  }
} 