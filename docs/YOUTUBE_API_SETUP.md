# YouTube API Setup for Part 7 - Video Publishing

## Required Environment Variables

Add these to your backend `.env` file or settings.json:

```bash
# YouTube Data API Configuration
YOUTUBE_API_KEY=your_youtube_api_key_here
YOUTUBE_CLIENT_ID=your_youtube_oauth_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_oauth_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3001/auth/youtube/callback
YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token
```

## Setup Steps

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing project
3. Enable the **YouTube Data API v3**
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the API key for `YOUTUBE_API_KEY`

### 2. OAuth 2.0 Setup
1. In Google Cloud Console → "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
2. Choose "Web application"
3. Add authorized redirect URI: `http://localhost:3001/auth/youtube/callback`
4. Copy the Client ID and Client Secret

### 3. Get Refresh Token
You'll need to implement an OAuth flow or use Google's OAuth 2.0 Playground:

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click settings ⚙️ → Use your own OAuth credentials
3. Enter your Client ID and Client Secret
4. In "Step 1", find "YouTube Data API v3" and select:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube`
5. Click "Authorize APIs"
6. In "Step 2", click "Exchange authorization code for tokens"
7. Copy the refresh_token

### 4. Test Setup
The system will automatically validate these credentials when publishing videos.

## Features Enabled
- ✅ **Post Now**: Immediately publish videos to YouTube Shorts
- 🕒 **Post at Recommended Time**: Schedule videos using node-cron
- 📊 **Status Tracking**: pending → scheduled/posted with MongoDB updates
- 🔗 **YouTube Links**: Direct links to published videos

## Security Notes
- Never commit API keys to version control
- Store credentials in environment variables or encrypted settings
- Consider rotating API keys periodically
- Use least-privilege access scopes 