import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { VideoModel } from '../models/Video';

const oauth2Client = new google.auth.OAuth2(
  process.env.YT_CLIENT_ID,
  process.env.YT_CLIENT_SECRET,
  process.env.YT_REDIRECT_URI
);

oauth2Client.setCredentials({
  access_token: process.env.YT_ACCESS_TOKEN,
  refresh_token: process.env.YT_REFRESH_TOKEN,
});

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client,
});

export async function publishToYouTube(video: any) {
  const filePath = path.resolve('/tmp', `${video._id}.mp4`);

  const res = await fetch(video.s3Url);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buffer));

  const fileSize = fs.statSync(filePath).size;

  try {
    const uploadRes = await youtube.videos.insert({
      part: ['snippet', 'status'],
      notifySubscribers: true,
      requestBody: {
        snippet: {
          title: video.caption?.slice(0, 100) || 'Uploaded via Lifestyle Design Social',
          description: video.caption || '',
          tags: ['shorts', 'real estate', 'social media'],
        },
        status: {
          privacyStatus: 'public',
        },
      },
      media: {
        body: fs.createReadStream(filePath),
      },
    }, {
      // @ts-ignore
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    console.log('✅ YouTube upload complete:', uploadRes.data.id);
    await VideoModel.findByIdAndUpdate(video._id, {
      youtubeVideoId: uploadRes.data.id,
    });

  } catch (error) {
    console.error('❌ YouTube upload failed:', error);
    throw error;
  } finally {
    fs.unlinkSync(filePath);
  }
} 