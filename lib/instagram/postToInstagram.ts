import axios from "axios";

export async function postToInstagram(videoUrl: string, caption: string) {
  const { data: container } = await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.IG_USER_ID}/media`,
    {
      video_url: videoUrl,
      caption,
      media_type: "REELS",
      access_token: process.env.IG_TOKEN,
    }
  );

  const { data: publish } = await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.IG_USER_ID}/media_publish`,
    {
      creation_id: container.id,
      access_token: process.env.IG_TOKEN,
    }
  );

  return publish;
} 