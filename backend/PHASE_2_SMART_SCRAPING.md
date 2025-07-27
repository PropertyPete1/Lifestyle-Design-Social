# PHASE 2: Smart Scraping & Repost System ✅ COMPLETE

## 🎯 Goal
Scrape YouTube + Instagram to find best-performing videos, top hashtags, and enable smart reposts

## ✅ Features Implemented

### 📊 Video Scraping
- **YouTube Scraper**: Scrapes top 20 highest-performing videos from any channel
- **Instagram Scraper**: Scrapes top 20 highest-performing videos from any page
- **Performance Scoring**: Weighted algorithm for views (40%), likes (35%), comments (25%)
- **Data Tracking**: Caption, hashtags, views, likes, post time, comments, video ID

### 💾 Data Storage
- **PostInsights Collection**: Stores all scraped video data with performance metrics
- **TopHashtags Collection**: Aggregates hashtag performance across platforms
- **Cross-Platform Analytics**: Tracks performance by platform and overall

### 🧠 Smart Repost Logic
- **Threshold System**: Triggers reposts after 20 new uploads
- **Candidate Selection**: Finds 1-3 top performers eligible for reposting
- **Content Refresh**: Generates new captions with fresh hooks and top hashtags
- **Scheduling Integration**: Queues reposts with Phase 6 scheduler
- **Cooldown Management**: Prevents reposting same content too frequently

## 📁 File Structure

```
backend/src/
├── models/
│   ├── PostInsights.ts      ✅ Video performance data
│   ├── TopHashtags.ts       ✅ Hashtag analytics
│   └── VideoStatus.ts       ✅ Upload tracking (for repost threshold)
├── services/
│   ├── youtubeScraper.ts    ✅ YouTube API scraping
│   ├── instagramScraper.ts  ✅ Instagram API scraping
│   ├── smartRepost.ts       ✅ Repost logic & scheduling
│   └── videoQueue.ts        ✅ Queue management (repost support)
├── routes/api/
│   ├── insights.ts          ✅ Phase 2 API endpoints
│   ├── youtube.ts           ✅ YouTube-specific endpoints
│   ├── instagram.ts         ✅ Instagram-specific endpoints
│   └── test.ts              ✅ Phase 2 test suite
└── lib/youtube/
    └── testPhase2.ts        ✅ Comprehensive test script
```

## 🌐 API Endpoints

### Core Phase 2 Endpoints

#### `POST /api/insights/phase2/run`
Complete Phase 2 scraping process
```json
{
  "credentials": {
    "youtube": {
      "apiKey": "your_youtube_api_key",
      "channelId": "UC...",
      "refreshToken": "optional"
    },
    "instagram": {
      "accessToken": "your_instagram_token",
      "pageId": "your_page_id"
    }
  }
}
```

#### `GET /api/insights/phase2/status`
Check Phase 2 implementation status and collected data

#### `POST /api/insights/scrape/youtube`
Scrape YouTube channel only

#### `POST /api/insights/scrape/instagram`
Scrape Instagram page only

#### `POST /api/insights/scrape/all`
Scrape both platforms simultaneously

### Smart Repost Endpoints

#### `POST /api/insights/repost/check`
Check if repost should be triggered (20 upload threshold)

#### `POST /api/insights/repost/trigger`
Manually trigger smart repost process

### Data Retrieval Endpoints

#### `GET /api/insights/videos`
Get scraped video insights with pagination
- Query params: `platform`, `page`, `limit`, `sortBy`, `sortOrder`

#### `GET /api/insights/hashtags`
Get top performing hashtags
- Query params: `platform`, `limit`, `sortBy`, `sortOrder`

#### `GET /api/insights/analytics`
Get insights analytics summary

### Test Endpoint

#### `POST /api/test/phase2`
Run comprehensive Phase 2 test suite

## 📊 Data Models

### PostInsight Model
```typescript
interface IPostInsight {
  platform: 'youtube' | 'instagram';
  videoId: string;
  caption: string;
  hashtags: string[];
  performanceScore: number;
  repostEligible: boolean;
  reposted: boolean;
  originalPostDate: Date;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  title?: string;
  scrapedAt: Date;
}
```

### TopHashtag Model
```typescript
interface ITopHashtag {
  hashtag: string;
  usageCount: number;
  avgViewScore: number;
  platform: 'youtube' | 'instagram' | 'both';
  totalViews: number;
  totalLikes: number;
  lastUpdated: Date;
}
```

## 🔄 Smart Repost Process

### 1. Trigger Conditions
- ✅ 20 new uploads since last repost
- ✅ Eligible videos with performance score > 1000
- ✅ Repost cooldown period respected (configurable, default 20 days)

### 2. Candidate Selection
- ✅ Sort by performance score
- ✅ Filter out recently posted content
- ✅ Select top 1-3 candidates

### 3. Content Refresh
- ✅ Extract core content without old hashtags
- ✅ Generate 10 hook variations
- ✅ Apply top-performing hashtags
- ✅ Create engaging repost captions

### 4. Scheduling
- ✅ Queue in VideoQueue with repost flags
- ✅ Mark original as reposted
- ✅ Schedule for optimal posting times

## 🧪 Testing

### Comprehensive Test Suite
Run the complete Phase 2 test suite:
```bash
# API endpoint
POST /api/test/phase2

# Direct script
npm run test:phase2
```

### Test Coverage
- ✅ Platform connectivity (YouTube & Instagram APIs)
- ✅ Scraping functionality validation
- ✅ Smart repost logic verification
- ✅ Data integrity checks
- ✅ API endpoint documentation

## 🚀 Usage Examples

### 1. Run Complete Phase 2 Process
```javascript
// POST /api/insights/phase2/run
const response = await fetch('/api/insights/phase2/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    credentials: {
      youtube: {
        apiKey: 'your_key',
        channelId: 'UC...'
      },
      instagram: {
        accessToken: 'your_token',
        pageId: 'your_page_id'
      }
    }
  })
});
```

### 2. Get Top Performing Videos
```javascript
// GET /api/insights/videos?platform=youtube&limit=10&sortBy=performanceScore
const topVideos = await fetch('/api/insights/videos?platform=youtube&limit=10&sortBy=performanceScore');
```

### 3. Check Repost Status
```javascript
// POST /api/insights/repost/check
const repostStatus = await fetch('/api/insights/repost/check', { method: 'POST' });
```

## 📈 Performance Scoring Algorithm

### YouTube Videos
```
performanceScore = (views × 0.4) + (likes × 35) + (comments × 25)
```

### Instagram Videos
```
performanceScore = (views × 0.5) + (likes × 30) + (comments × 20)
```

## ⚙️ Configuration

### Settings in `backend/settings.json`
```json
{
  "youtubeApiKey": "your_youtube_api_key",
  "youtubeChannelId": "UC...",
  "instagramAccessToken": "your_instagram_token",
  "instagramBusinessId": "your_business_id",
  "repostCooldownDays": 20,
  "minPerformanceScore": 1000
}
```

## 🔄 Integration with Other Phases

### Phase 1 Integration
- ✅ Uses VideoStatus model for upload counting
- ✅ Integrates with repost detection system
- ✅ Respects existing cooldown mechanisms

### Phase 6 Integration (Ready)
- ✅ VideoQueue supports repost scheduling
- ✅ Optimal timing can be applied to reposts
- ✅ Platform-specific scheduling supported

## ✅ Phase 2 Complete Status

### All Requirements Met
- ✅ Scrape top 20 highest-performing videos on both platforms
- ✅ Track: caption, hashtags, views, likes, post time, comments, and video ID
- ✅ Save to PostInsights and TopHashtags collections
- ✅ Smart repost logic with 20 new posts threshold
- ✅ Queue 1–3 ghost reposts with updated caption + hashtags
- ✅ Schedule automatically using Phase 6 scheduler integration
- ✅ Learn from top content across platforms
- ✅ Recycle proven winners without looking spammy

### Ready for Production
- ✅ Comprehensive error handling
- ✅ Rate limiting and API respect
- ✅ Data validation and integrity checks
- ✅ TypeScript implementation throughout
- ✅ Extensive test coverage
- ✅ Complete API documentation

## 🔗 Next Steps
Phase 2 is complete and ready for Phase 3 integration. The smart scraping system will provide valuable data for trending audio matching and enhanced content optimization. 