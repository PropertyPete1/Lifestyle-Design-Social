import { google } from 'googleapis';
import { Readable } from 'stream';
import { YouTubePostPayload } from '../../types/Video';

export async function publishToYouTube(video: YouTubePostPayload) {
  const auth = new google.auth.OAuth2(
    process.env.YT_CLIENT_ID,
    process.env.YT_CLIENT_SECRET,
    process.env.YT_REDIRECT_URI
  );

  auth.setCredentials({ refresh_token: process.env.YT_REFRESH_TOKEN });

  const youtube = google.youtube({ version: 'v3', auth });

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: video.title,
        description: video.description,
        tags: video.tags,
      },
      status: {
        privacyStatus: 'public',
      },
    },
    media: {
      body: Readable.from(video.buffer),
    },
  });

  return res.data;
} 