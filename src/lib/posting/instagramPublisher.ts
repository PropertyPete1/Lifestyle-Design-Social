import axios from "axios";
import * as Sentry from "@sentry/node";
import { getInstagramToken, getInstagramUserId } from "../auth/tokenManager";

export interface PostResult {
  success: boolean;
  error?: string;
}

export async function postToInstagram(videoUrl: string, caption: string): Promise<PostResult> {
  try {
    const accessToken = await getInstagramToken();
    const userId = await getInstagramUserId();

    // Step 1: Create media container
    const containerRes = await axios.post(
      `https://graph.facebook.com/v18.0/${userId}/media`,
      {
        media_type: "REEL",
        video_url: videoUrl,
        caption,
        share_to_feed: true,
      },
      {
        params: { access_token: accessToken },
      }
    );

    const creationId = containerRes.data.id;

    // Step 2: Publish media
    const publishRes = await axios.post(
      `https://graph.facebook.com/v18.0/${userId}/media_publish`,
      {
        creation_id: creationId,
      },
      {
        params: { access_token: accessToken },
      }
    );

    return { success: true };
  } catch (error: any) {
    console.error("Instagram publish error:", error.response?.data || error.message);
    Sentry.captureException(error);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || "Unknown error",
    };
  }
} 