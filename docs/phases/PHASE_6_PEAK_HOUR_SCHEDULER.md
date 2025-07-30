# 🕒 PHASE 6 - PEAK HOUR SCHEDULER

## Overview
Phase 6 implements intelligent peak hour detection for both YouTube and Instagram by analyzing historical post performance data to identify optimal posting times that maximize engagement.

## Features

### ✅ Core Functionality
- **Multi-Platform Analysis**: Supports both YouTube and Instagram
- **Automated Scheduling**: Runs daily at 2 AM via cron job
- **Performance Tracking**: Analyzes views, likes, comments, and engagement ratios
- **Optimal Time Calculation**: Provides ranked posting times by engagement score
- **Real-time Status**: Monitor analysis progress and data freshness

### ✅ Data Collection
- **YouTube**: Last 60 videos with detailed analytics
- **Instagram**: Last 60 posts with insights data
- **Metrics Tracked**:
  - Post timestamp (hour and day of week)
  - Views after 60 minutes
  - Likes-to-views ratio
  - Comments per hour
  - Composite engagement score (0-100)

### ✅ Smart Scoring Algorithm
- **YouTube Scoring**:
  - 40% Like ratio weight
  - 30% Comments weight (capped)
  - 30% Views weight (normalized)
- **Instagram Scoring**:
  - 35% Like ratio weight
  - 25% Comments weight (capped)
  - 25% Views/Impressions weight
  - 15% Reach weight

## Database Model

### PeakEngagementTimes Schema
```typescript
{
  platform: 'youtube' | 'instagram',
  dayOfWeek: string, // Sunday-Saturday
  hour: number, // 0-23
  avgScore: number, // Average engagement score
  totalPosts: number, // Number of posts analyzed
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### GET /api/peak-hours/optimal-times
Get optimal posting times ranked by engagement score.

**Query Parameters:**
- `platform` (optional): 'youtube' | 'instagram' | undefined (all)
- `limit` (optional): Number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "youtube": [...],
    "instagram": [...],
    "combined": [...]
  },
  "platform": "all",
  "limit": 10
}
```

### GET /api/peak-hours/status
Get current analysis status and data metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": false,
    "schedulerActive": true,
    "dataPoints": {
      "youtube": 168,
      "instagram": 134,
      "total": 302
    },
    "lastUpdate": "2025-01-27T10:30:00.000Z",
    "nextScheduledRun": "2:00 AM daily"
  }
}
```

### POST /api/peak-hours/analyze
Trigger manual analysis for one or both platforms.

**Request Body:**
```json
{
  "platform": "youtube" | "instagram" | undefined // undefined = both
}
```

**Response:**
```json
{
  "success": true,
  "message": "Full peak hours analysis started for both platforms",
  "platform": "all"
}
```

### GET /api/peak-hours/data
Get raw peak engagement data with filtering options.

**Query Parameters:**
- `platform` (optional): Filter by platform
- `dayOfWeek` (optional): Filter by specific day
- `minScore` (optional): Minimum engagement score threshold

### GET /api/peak-hours/best-time/:dayOfWeek
Get best posting times for a specific day of the week.

**Parameters:**
- `dayOfWeek`: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday

**Query Parameters:**
- `platform` (optional): Filter by platform

### POST /api/peak-hours/scheduler/:action
Start or stop the automated scheduler.

**Parameters:**
- `action`: 'start' | 'stop'

## Implementation Files

### Core Components
- `backend/src/models/PeakEngagementTimes.ts` - Database model
- `backend/src/lib/peakHours/scheduler.ts` - Main scheduler service
- `backend/src/lib/youtube/analyzePeakHours.ts` - YouTube analyzer
- `backend/src/lib/instagram/analyzePeakHours.ts` - Instagram analyzer
- `backend/src/routes/api/peakHours.ts` - API endpoints

### Integration
- Added to `backend/app.ts` for automatic startup
- Added to `backend/src/routes/index.ts` for API routing
- Test script: `backend/src/lib/youtube/testPhase6.ts`

## Usage Examples

### 1. Get Optimal Times for YouTube
```bash
curl "http://localhost:3001/api/peak-hours/optimal-times?platform=youtube&limit=5"
```

### 2. Trigger Manual Analysis
```bash
curl -X POST "http://localhost:3001/api/peak-hours/analyze" \
  -H "Content-Type: application/json" \
  -d '{"platform": "instagram"}'
```

### 3. Check Analysis Status
```bash
curl "http://localhost:3001/api/peak-hours/status"
```

### 4. Get Best Time for Monday
```bash
curl "http://localhost:3001/api/peak-hours/best-time/Monday?platform=youtube"
```

## Environment Variables Required

### YouTube API
- `YOUTUBE_API_KEY` - YouTube Data API v3 key

### Instagram API  
- `INSTAGRAM_ACCESS_TOKEN` - Instagram Basic Display API token
- `FACEBOOK_PAGE_ID` - Connected Facebook Page ID

## Testing

Run the Phase 6 test suite:
```bash
npm run test:phase6
```

This will test:
- Database connectivity
- Model validation
- Scheduler functionality
- Data analysis capabilities
- API endpoint readiness

## Scheduler Configuration

### Automatic Execution
- **Frequency**: Daily at 2:00 AM
- **Startup**: Auto-starts with backend server
- **Overlap Protection**: Prevents concurrent analysis runs

### Manual Control
- Start scheduler: `POST /api/peak-hours/scheduler/start`
- Stop scheduler: `POST /api/peak-hours/scheduler/stop`
- Status check: `GET /api/peak-hours/status`

## Data Flow

1. **Collection**: Scrape last 60 posts from each platform
2. **Processing**: Calculate engagement metrics for each post
3. **Grouping**: Group by day of week and hour
4. **Scoring**: Calculate average engagement scores
5. **Storage**: Update database with new insights
6. **Optimization**: Provide ranked optimal posting times

## Performance Considerations

### Rate Limiting
- Instagram API: 100ms delay between requests
- YouTube API: Batch requests where possible
- Error handling with graceful fallbacks

### Data Efficiency
- Compound indexes on platform + dayOfWeek + hour
- Upsert operations to prevent duplicates
- Lean queries for better performance

## Integration with Auto-Poster

Phase 6 provides optimal posting times that can be consumed by the auto-posting system to:

1. **Schedule Posts**: Use peak hours for maximum engagement
2. **Platform Optimization**: Different times for YouTube vs Instagram
3. **Day-Specific Timing**: Adjust schedule based on day of week
4. **Performance Tracking**: Monitor if peak time posting improves results

## Future Enhancements

- **Seasonal Analysis**: Track optimal times across different seasons
- **Content-Type Optimization**: Different peak times for videos vs images
- **Audience Demographics**: Factor in follower time zones
- **A/B Testing**: Compare performance of peak vs off-peak posting
- **Machine Learning**: Predict future peak times based on trends

---

## Status: ✅ COMPLETE

Phase 6 Peak Hour Scheduler is fully implemented and production-ready with:
- ✅ Complete data collection for both platforms
- ✅ Intelligent engagement scoring algorithms  
- ✅ Automated daily analysis scheduling
- ✅ Comprehensive API endpoints
- ✅ Real-time status monitoring
- ✅ Manual analysis triggers
- ✅ Platform-specific optimization
- ✅ Database integration with indexing
- ✅ Error handling and rate limiting
- ✅ Test suite for validation 