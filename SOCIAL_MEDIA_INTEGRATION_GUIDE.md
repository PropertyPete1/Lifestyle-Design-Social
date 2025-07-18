# 🚀 Social Media Integration Guide - Production Ready

## 📋 Overview
This guide will help you set up **real** social media integrations for your Lifestyle Design Social platform to post to Instagram, YouTube, and TikTok automatically.

---

## 🔥 Quick Setup Status
**Current Status**: ✅ Backend endpoints ready, authentication fixed  
**Next Step**: Set up real API credentials  
**Time to Live**: ~30 minutes for Instagram, ~1 hour for YouTube, ~3-7 days for TikTok

---

## 📸 Instagram Integration

### Step 1: Facebook Developer Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" → "Business" → "Next"
3. App Details:
   - **App Name**: "Lifestyle Design Social"
   - **Contact Email**: your-email@example.com
   - **App Purpose**: "Auto-posting real estate content"

### Step 2: Instagram Basic Display API
```bash
# Add these to your backend/.env file:
INSTAGRAM_APP_ID=your_facebook_app_id
INSTAGRAM_APP_SECRET=your_facebook_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback
```

### Step 3: Get Instagram Access Token
```javascript
// Already implemented in backend/src/routes/oauth.ts
// Just add your credentials and test!

// 1. Visit this URL (replace YOUR_APP_ID):
// https://api.instagram.com/oauth/authorize?client_id=YOUR_APP_ID&redirect_uri=http://localhost:3000/auth/instagram/callback&scope=user_profile,user_media&response_type=code

// 2. User authorizes → gets callback with code
// 3. Exchange code for access token (already coded!)
```

### Step 4: Test Instagram Posting
```bash
# Test endpoint (already working):
curl -X POST http://localhost:5001/api/platforms/connect/instagram \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🎥 YouTube Integration

### Step 1: Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Lifestyle Design Social"
3. Enable YouTube Data API v3:
   - APIs & Services → Library → Search "YouTube Data API v3" → Enable

### Step 2: OAuth 2.0 Credentials
```bash
# In Google Cloud Console:
# 1. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs
# 2. Application type: Web application
# 3. Authorized redirect URIs: http://localhost:3000/auth/youtube/callback

# Add to backend/.env:
YOUTUBE_CLIENT_ID=your_google_client_id.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_google_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/auth/youtube/callback
```

### Step 3: Video Upload Implementation
```javascript
// Already coded in backend/src/integrations/youtube/
// Just add your credentials!

// Upload a video:
curl -X POST http://localhost:5001/api/youtube/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "video=@your-video.mp4" \
  -F "title=Amazing Real Estate Property" \
  -F "description=Check out this stunning property!"
```

---

## 🎵 TikTok Integration

### ⚠️ Important: TikTok Approval Process
TikTok requires **manual approval** which can take 3-7 business days.

### Step 1: Apply for TikTok Developer Access
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Apply for access (business account required)
3. Wait for approval email

### Step 2: Create TikTok App (After Approval)
```bash
# Add to backend/.env after approval:
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=http://localhost:3000/auth/tiktok/callback
```

### Step 3: Test TikTok Upload
```bash
# After approval and setup:
curl -X POST http://localhost:5001/api/platforms/connect/tiktok \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🏗️ Implementation Checklist

### ✅ Backend Ready (Already Done)
- [x] Authentication system working
- [x] Platform status endpoints
- [x] File upload handling
- [x] Database models for posts
- [x] JWT token management
- [x] Error handling and logging

### 🔄 Setup Required (Your Part)
- [ ] **Instagram**: Get Facebook App ID + Secret (15 minutes)
- [ ] **YouTube**: Enable API + Get OAuth credentials (30 minutes)  
- [ ] **TikTok**: Apply for developer access (3-7 days wait)
- [ ] Add API credentials to backend/.env
- [ ] Test each platform connection

### 🚀 Production Ready Features
- [ ] Auto-posting scheduler
- [ ] Content optimization for each platform
- [ ] Analytics tracking
- [ ] Error notifications
- [ ] Backup posting options

---

## 🎯 Quick Start Commands

### 1. Set Up Instagram (Fastest)
```bash
# 1. Get Facebook App credentials
# 2. Add to .env file:
echo "INSTAGRAM_APP_ID=your_app_id" >> backend/.env
echo "INSTAGRAM_APP_SECRET=your_app_secret" >> backend/.env

# 3. Test connection:
curl -X POST http://localhost:5001/api/platforms/connect/instagram \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:5001/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"working@test.com\",\"password\":\"password123\"}' | jq -r '.data.token')"
```

### 2. Set Up YouTube
```bash
# 1. Enable YouTube Data API v3 in Google Cloud
# 2. Create OAuth credentials
# 3. Add to .env:
echo "YOUTUBE_CLIENT_ID=your_client_id" >> backend/.env
echo "YOUTUBE_CLIENT_SECRET=your_secret" >> backend/.env

# 4. Test:
curl -X POST http://localhost:5001/api/platforms/connect/youtube \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Upload Your First Video
```bash
# After platform setup, upload a real estate video:
curl -X POST http://localhost:5001/api/videos/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "video=@path/to/your/real-estate-video.mp4" \
  -F "title=Beautiful Real Estate Property" \
  -F "description=Amazing property in great location" \
  -F "platform=instagram"
```

---

## 🎬 Cartoon Auto-Posting (Already Working!)

The system can already create and post cartoon real estate videos:

```bash
# Create a cartoon video:
curl -X POST http://localhost:5001/api/autopost/create-cartoon

# Get cartoon stats:
curl http://localhost:5001/api/autopost/cartoon-stats

# Schedule cartoon posting:
curl -X POST http://localhost:5001/api/autopost/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"postingTimes": ["09:00", "13:00", "18:00"]}'
```

---

## 🔐 Security Best Practices

### Environment Variables
```bash
# backend/.env (NEVER commit this file!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
MONGODB_URI=your-mongodb-connection-string

# Social Media APIs
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# Optional: Advanced Features
OPENAI_API_KEY=your_openai_key_for_ai_captions
RUNWAYML_API_KEY=your_runwayml_key_for_ai_videos
```

### Production Checklist
- [ ] Use HTTPS in production
- [ ] Secure API keys in environment variables
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure CORS properly
- [ ] Use strong JWT secrets
- [ ] Enable database authentication

---

## 🎊 Next Steps

1. **Choose a platform** to start with (Instagram recommended - easiest setup)
2. **Get API credentials** from that platform
3. **Add to your .env file**
4. **Test the connection** using the curl commands above
5. **Upload your first video** and schedule posts!

---

## 🆘 Need Help?

### Common Issues:
- **404 errors**: ✅ Fixed! All endpoints working
- **Authentication fails**: ✅ Fixed! JWT working properly
- **Platform not connecting**: Get proper API credentials
- **Videos not uploading**: Check file size limits and formats

### Testing Commands:
```bash
# Test backend health:
curl http://localhost:5001/api/health

# Test authentication:
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"working@test.com","password":"password123"}'

# Test platform status:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/platforms/status
```

**Ready to make this production-ready! 🚀** 