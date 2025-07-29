# 🏡 Lifestyle Design Auto Poster

**Intelligent Real Estate Social Media Automation Platform**

A comprehensive, AI-powered social media automation system that intelligently reposts high-performing Instagram content to both Instagram and YouTube with enhanced visual quality, optimized captions, and trending audio integration.

## 🚀 **Features**

### **Phase 9 - Intelligent Content Repurposing**
- **Instagram Scraper**: Automatically fetches latest 500 Instagram posts with full engagement metrics
- **Smart Filtering**: Only reposts content with 10K+ views, 20+ days old, not in last 20 reposts
- **Dual-Platform Posting**: Simultaneous posting to Instagram and YouTube with platform-specific optimization
- **Visual Enhancement**: Auto-brightness +15%, contrast enhancement, sharpen filter, color normalization
- **AI Caption Rewriting**: GPT-4 powered caption generation with no dashes, strong hooks, emojis, CTAs
- **Trending Audio Integration**: Automatic audio matching for both platforms
- **Peak Hour Scheduling**: Intelligent timing based on engagement data
- **Dropbox Storage**: Automatic backup with proper filename format

### **Autopilot Modes**
- **Off**: Manual operation only
- **Dropbox**: Monitor uploads but no Instagram scraping
- **Instagram**: Full Instagram scraping and reposting
- **Both**: Complete dual-platform automation (recommended)

## 🛠 **Tech Stack**

### **Backend**
- **Node.js** with **TypeScript**
- **Express.js** API server
- **MongoDB** with Mongoose ODM
- **FFmpeg** for video processing
- **OpenAI GPT-4** for caption generation
- **Instagram Graph API** for content scraping
- **YouTube Data API v3** for uploads
- **Dropbox API** for storage sync

### **Frontend**
- **Next.js 15** with **TypeScript**
- **React 18** with modern hooks
- **Tailwind CSS** for styling
- **Real-time dashboard** with live metrics

## 📦 **Installation**

### **Prerequisites**
- Node.js 18+ 
- MongoDB (local or Atlas)
- FFmpeg installed
- API keys for: Instagram, YouTube, OpenAI, Dropbox

### **Local Development**
```bash
# Clone repository
git clone https://github.com/PropertyPete1/Lifestyle-Social.git
cd Lifestyle-Social

# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies  
npm install --prefix frontend

# Start backend (port 3001)
npm run dev --prefix backend

# Start frontend (port 3000)
npm run dev --prefix frontend
```

## 🌐 **Production Deployment**

### **Backend (Render)**
- Deployed at: `https://lifestyle-social-backend.onrender.com`
- Auto-deploys from `main` branch
- Includes all Phase 9 automation features

### **Frontend (Vercel)**
- Deployed at: `https://lifestyle-social.vercel.app`
- Connected to production backend
- Real-time dashboard and controls

### **Database (MongoDB Atlas)**
- Cloud-hosted MongoDB cluster
- Automatic backups and scaling
- Optimized indexes for Phase 9 operations

## 🔧 **Environment Variables**

### **Backend (.env)**
```env
# Database
MONGO_URI=mongodb+srv://...
MONGO_DATABASE=lifestyle-design-auto-poster

# Instagram API
INSTAGRAM_ACCESS_TOKEN=EAA...
INSTAGRAM_BUSINESS_ID=17841454131323777
INSTAGRAM_APP_ID=2090398888156566
INSTAGRAM_USER_ID=732022579657643

# YouTube API
YOUTUBE_API_KEY=AIzaSy...
YOUTUBE_CLIENT_ID=823598477516-...
YOUTUBE_CLIENT_SECRET=GOCSPX-...
YOUTUBE_REFRESH_TOKEN=1//0f...
YOUTUBE_CHANNEL_ID=UCqSfOt2aLrKKiROnY4kGBcQ

# AI Services
OPENAI_API_KEY=sk-proj-...

# Storage
DROPBOX_API_KEY=sl.u.AF7a04nF_...

# App Settings
PORT=3001
NODE_ENV=production
PHASE9_AUTOPILOT_MODE=both
MAX_REPOSTS_PER_DAY=8
MIN_DAYS_BETWEEN_POSTS=20
```

### **Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=https://lifestyle-social-backend.onrender.com
NEXT_PUBLIC_BASE_URL=https://lifestyle-social.vercel.app
```

## 📊 **Current Production Metrics**

- **Total Posts Processed**: 500 (real Instagram content)
- **Top Performers Identified**: 14 (10K+ views)
- **Total Engagement**: 134,269 (likes + comments)
- **Posts Queued**: 28 (14 Instagram + 14 YouTube)
- **Processing Frequency**: Every 15 minutes
- **Scraping Frequency**: Every 2 hours
- **Next Scheduled Post**: Auto-scheduled based on peak hours

## 🔄 **Automation Schedule**

### **Daily Operations**
- **02:00 AM**: Daily content refresh and hashtag updates
- **Every 2 hours**: Instagram content scraping (500 latest posts)
- **Every 15 minutes**: Dual-platform repost processing
- **Peak hours**: Intelligent post scheduling based on engagement data

### **Content Processing Pipeline**
1. **Scrape** → Instagram API fetches latest 500 posts
2. **Filter** → Apply 10K+ views, 20+ days, last 20 exclusion criteria
3. **Enhance** → Visual quality improvements (brightness, contrast, sharpen)
4. **Rewrite** → GPT-4 generates fresh captions without dashes
5. **Optimize** → Platform-specific hashtags and audio matching
6. **Schedule** → Peak hour timing based on historical data
7. **Post** → Simultaneous Instagram and YouTube publishing
8. **Backup** → Dropbox sync with proper filename format

## 🎯 **Key Performance Features**

### **Smart Content Selection**
- Only reposts content with proven engagement (10K+ views)
- Avoids recent duplicates (last 20 posts excluded)
- Ensures content maturity (20+ days old)

### **Platform Optimization**
- **Instagram**: 30 trending hashtags, mobile-optimized captions
- **YouTube**: 15 hashtags max, SEO-optimized descriptions, Shorts format

### **Visual Enhancement Pipeline**
- **Brightness**: +15% automatic enhancement
- **Contrast**: 1.1x boost for better visibility  
- **Sharpening**: Unsharp mask filter for crisp details
- **Color Correction**: Remove yellow/green cast, normalize tones
- **Resolution**: Optimize for 1080x1920 or maintain aspect ratio

## 📈 **Analytics & Monitoring**

### **Real-Time Dashboard**
- Live posting status and queue management
- Performance metrics and engagement tracking
- Error monitoring and automatic retry logic
- Platform-specific analytics and insights

### **Automated Reporting**
- Daily performance summaries
- Weekly engagement reports
- Monthly growth analytics
- Error logs and system health monitoring

## 🔐 **Security & Compliance**

- **API Rate Limiting**: Respects platform limits with intelligent backoff
- **Token Management**: Automatic refresh for long-lived tokens
- **Error Handling**: Graceful degradation with fallback mechanisms
- **Data Privacy**: Compliant with platform terms of service

## 🤝 **Contributing**

This is a production system for Lifestyle Design Realty. For support or modifications, contact the development team.

## 📄 **License**

Proprietary software for Lifestyle Design Realty Texas. All rights reserved.

---

**🏡 Lifestyle Design Realty | Texas Premier Real Estate**  
**📧 Contact**: peter@lifestyledesignrealty.com  
**🌐 Website**: [Lifestyle Design Realty](https://lifestyledesignrealty.com)