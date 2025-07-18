import axios from 'axios';
import { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID } from './constants';

interface InstagramPublishPayload {
  videoUrl: string;
  caption: string;
}

export async function publishInstagramVideo(payload: InstagramPublishPayload) {
  const { videoUrl, caption } = payload;

  // Step 1: Upload the video container
  const containerRes = await axios.post(
    `https://graph.facebook.com/v19.0/${INSTAGRAM_USER_ID}/media`,
    {
      video_url: videoUrl,
      caption,
      media_type: 'VIDEO',
      access_token: INSTAGRAM_ACCESS_TOKEN,
    }
  );

  const containerId = containerRes.data.id;

  // Step 2: Publish the container
  const publishRes = await axios.post(
    `https://graph.facebook.com/v19.0/${INSTAGRAM_USER_ID}/media_publish`,
    {
      creation_id: containerId,
      access_token: INSTAGRAM_ACCESS_TOKEN,
    }
  );

  return publishRes.data;
} 