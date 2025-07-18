import { uploadToYouTube } from './upload';
import { createYouTubeVideoObject } from './createVideoObject';
import { oauth2Client } from './oauthClient';
import { YouTubeVideoPayload } from './types';

export async function publishToYouTube(payload: YouTubeVideoPayload) {
  const videoResource = createYouTubeVideoObject(payload);

  return await uploadToYouTube(payload);
} 