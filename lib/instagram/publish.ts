import axios from 'axios';
import { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID } from './constants';

export async function publishToInstagramReels(caption: string, videoUrl: string): Promise<void> {
  const createContainer = await axios.post(
    `https://graph.facebook.com/v19.0/${INSTAGRAM_USER_ID}/media`,
    {
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
    },
    {
      params: { access_token: INSTAGRAM_ACCESS_TOKEN },
    }
  );

  const creationId = createContainer.data.id;

  await axios.post(
    `https://graph.facebook.com/v19.0/${INSTAGRAM_USER_ID}/media_publish`,
    { creation_id: creationId },
    {
      params: { access_token: INSTAGRAM_ACCESS_TOKEN },
    }
  );
} 