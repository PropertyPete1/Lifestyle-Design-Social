# YouTube OAuth Setup Guide

## Overview
To use YouTube functionality in the Lifestyle Design Auto Poster, you need TWO credentials:

1. **YouTube API Key** - For general API access (public data)
2. **YouTube Refresh Token** - For authenticated operations (uploading, private data)

## Step 1: Create Google Cloud Project & Enable APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - YouTube Data API v3
   - YouTube Reporting API (optional)

## Step 2: Get YouTube API Key

1. In Google Cloud Console, go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS > API key**
3. Copy the API key
4. (Optional) Restrict the API key to YouTube APIs for security

## Step 3: Set Up OAuth for Refresh Token

### Create OAuth Credentials
1. In **APIs & Services > Credentials**, click **+ CREATE CREDENTIALS > OAuth 2.0 Client IDs**
2. Choose **Web application**
3. Add authorized redirect URIs:
   - `http://localhost:8080/oauth2callback`
   - `https://developers.google.com/oauthplayground`

### Get Refresh Token Using OAuth Playground
1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the settings gear ⚙️ in top-right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret from step above
5. In the left panel, find **YouTube Data API v3**
6. Select these scopes:
   - `https://www.googleapis.com/auth/youtube`
   - `https://www.googleapis.com/auth/youtube.upload`
7. Click **Authorize APIs**
8. Sign in with your YouTube channel's Google account
9. Click **Exchange authorization code for tokens**
10. Copy the **Refresh Token** (starts with `1//`)

## Step 4: Add Credentials to Settings

In your app settings, add:
- **YouTube API Key**: The API key from Step 2
- **YouTube Channel ID**: Your channel's ID (starts with `UC`)
- **YouTube Refresh Token**: The refresh token from Step 3

## Finding Your YouTube Channel ID

1. Go to your YouTube channel
2. Look at the URL: `youtube.com/channel/UC...` 
3. The part after `/channel/` is your Channel ID
4. OR use: `youtube.com/c/YourChannelName/about` and view page source, search for "channelId"

## What Each Credential Does

- **API Key**: Reads public video data, channel info, video statistics
- **Refresh Token**: Uploads videos, manages playlists, accesses private data
- **Channel ID**: Identifies which channel to scrape/manage

## Troubleshooting

- **"API key not valid"**: Check API key is correct and YouTube Data API is enabled
- **"Invalid refresh token"**: Token may have expired, regenerate using OAuth Playground
- **"Channel not found"**: Double-check Channel ID starts with "UC" not "@username"

## Security Notes

- Keep your API key and refresh token secure
- Never commit them to public repositories
- Consider restricting API key to specific IPs/domains in production
- Refresh tokens can expire if not used for 6 months 