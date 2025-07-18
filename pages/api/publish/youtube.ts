import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { logYouTubePost } from '@/lib/db/logYouTubePost';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const YOUTUBE_ACCESS_TOKEN = process.env.YOUTUBE_ACCESS_TOKEN!;
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID!;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET!;
const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN!;

const oauth2Client = new google.auth.OAuth2(
  YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: YOUTUBE_REFRESH_TOKEN,
  access_token: YOUTUBE_ACCESS_TOKEN,
});

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { videoUrl, title, description } = req.body;

  try {
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
        },
        status: {
          privacyStatus: 'public',
        },
      },
      media: {
        body: await fetch(videoUrl).then(res => res.body as any),
      },
    });

    const videoId = response.data.id!;
    await logYouTubePost(videoId, title, description);

    res.status(200).json({ success: true, videoId });
  } catch (err: any) {
    console.error('YouTube publish error:', err);
    res.status(500).json({ error: 'YouTube publishing failed' });
  }
} 