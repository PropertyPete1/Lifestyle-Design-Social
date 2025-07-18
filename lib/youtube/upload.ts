import { google } from "googleapis";
import { createReadStream } from "fs";
import { oauth2Client } from "./oauthClient";
import { createYouTubeVideoObject } from "./createVideoObject";
import { YouTubeVideoPayload } from "./types";

export async function uploadToYouTube(payload: YouTubeVideoPayload): Promise<string> {
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: createYouTubeVideoObject(payload),
    media: {
      body: createReadStream(payload.videoUrl),
    },
  });

  return res.data.id || "";
} 