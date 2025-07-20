import { google } from "googleapis";

export async function postToYouTube(title: string, description: string, filePath: string, accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title,
        description,
      },
      status: {
        privacyStatus: "public",
      },
    },
    media: {
      body: require("fs").createReadStream(filePath),
    },
  });

  return res.data;
} 