# 🚀 Lifestyle Design Auto Poster - Phase 9 Complete

**Intelligent Instagram & YouTube Automation Platform**

## 🎯 Current Status: Phase 9 Production Ready

✅ **Fully Automated Social Media Posting**  
✅ **Instagram Video Auto-Pilot** (10K+ view filtering)  
✅ **Dual-Platform Optimization** (Instagram + YouTube)  
✅ **GPT-4 Caption Rewriting** (No dashes rule enforced)  
✅ **Trending Audio Matching** per platform  
✅ **Cloud Deployment Ready** (Render + Vercel)

## 🏗️ Architecture

```
├── backend/           # Express.js API with TypeScript
├── frontend/          # Next.js 15 Dashboard
├── docs/              # Project documentation
│   ├── phases/        # Phase completion summaries
│   └── deploy-to-cloud.md
└── mongodb-backup/    # Database backups
```

## 🚀 Quick Start

### Local Development
```bash
# Backend
npm install --prefix backend
npm run dev --prefix backend

# Frontend  
npm install --prefix frontend
npm run dev --prefix frontend
```

### Cloud Deployment
- **Backend**: Auto-deploys to Render from GitHub main branch
- **Frontend**: Auto-deploys to Vercel
- **Database**: MongoDB Atlas integration

## 🎯 Phase 9 Features

### 📱 Instagram Auto-Pilot
- Scrapes your Instagram for top-performing videos (10K+ views)
- Filters content to videos only (no images)
- Applies 20+ day cooldown and last-20-post exclusion
- Automatic reposting with fresh captions and trending hashtags

### 🤖 Intelligent Content Processing
- **GPT-4 Caption Rewriting**: No dashes rule enforced
- **Trending Hashtag Integration**: 30 for Instagram, 15 for YouTube
- **Platform-Specific Audio**: Instagram Reels audio for IG, YouTube audio for YT
- **OpenAI Fallback System**: Works even when quota exceeded

### 📊 Dual-Platform Automation
- Simultaneous posting to Instagram and YouTube
- Platform-optimized captions and hashtags
- Intelligent scheduling based on peak engagement times
- Real-time queue management and success tracking

## 🔧 Configuration

Environment variables are managed through:
- **Local**: `backend/settings.json`
- **Cloud**: Render environment variables

### Required APIs
- Instagram Business API (Meta)
- YouTube Data API v3 (Google)
- OpenAI API (GPT-4)
- MongoDB Atlas
- Dropbox API (optional)

## 📈 Current Performance

- **Success Rate**: 92% (11/12 recent posts)
- **Content Processed**: 500 Instagram videos analyzed
- **Top Performers**: 14 videos meeting 10K+ view criteria
- **Queue Status**: 24 posts scheduled across both platforms

## 🌐 Live Deployment

- **Frontend**: https://lifestyle-social.vercel.app
- **Backend**: https://lifestyle-social-backend.onrender.com
- **Status**: Phase 9 autopilot running 24/7 in cloud

## 📋 Documentation

Complete phase documentation available in [`docs/phases/`](./docs/phases/):
- Phase 1-8 completion summaries
- Phase 9 restart guide and implementation details
- Cloud deployment instructions

---

**Built with TypeScript, Next.js 15, Express.js, MongoDB, and ❤️**