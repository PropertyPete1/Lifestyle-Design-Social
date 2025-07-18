import { google } from 'googleapis';

export function getYouTubeOAuthClient() {
  const clientId = process.env.YOUTUBE_CLIENT_ID!;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET!;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI!;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN!;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return oauth2Client;
} 