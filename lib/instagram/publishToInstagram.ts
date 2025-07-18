import axios from 'axios';
import { InstagramPostPayload } from './types';

const IG_USER_ID = process.env.INSTAGRAM_USER_ID!;
const IG_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN!;

export async function publishToInstagram({ caption, videoUrl }: InstagramPostPayload) {
  try {
    // Step 1: Upload video container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${IG_USER_ID}/media`,
      {
        media_type: 'VIDEO',
        video_url: videoUrl,
        caption,
      },
      {
        params: {
          access_token: IG_ACCESS_TOKEN,
        },
      }
    );

    const creationId = containerResponse.data.id;

    // Step 2: Publish the media container
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish`,
      {
        creation_id: creationId,
      },
      {
        params: {
          access_token: IG_ACCESS_TOKEN,
        },
      }
    );

    return publishResponse.data;
  } catch (error: any) {
    console.error('Failed to publish to Instagram:', error.response?.data || error.message);
    throw new Error('Instagram publish failed');
  }
} 