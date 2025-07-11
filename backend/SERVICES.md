# Services Layer Documentation

This document describes the service layer components of the Real Estate Auto-Posting App.

## Overview

The services layer contains the business logic for:
- Video processing and optimization
- Automated posting to Instagram
- Caption generation with AI
- Analytics and engagement tracking
- Scheduling and timing optimization

## Service Components

### 1. VideoProcessingService

Handles video upload, processing, and optimization for Instagram posting.

**Key Features:**
- Video metadata extraction using FFmpeg
- Thumbnail generation
- Video compression for optimal upload
- Instagram format validation
- File cleanup and management

**Main Methods:**
```typescript
// Process uploaded video
processVideo(filePath: string, userId: string, options: ProcessingOptions)

// Extract video metadata
extractMetadata(filePath: string): Promise<VideoMetadata>

// Generate thumbnail
generateThumbnail(filePath: string, metadata: VideoMetadata): Promise<string>

// Compress video for Instagram
compressVideo(filePath: string, metadata: VideoMetadata): Promise<string>
```

**Instagram Video Requirements:**
- Max duration: 60 seconds
- Max file size: 100MB
- Recommended dimensions: 1080x1080
- Recommended bitrate: 2Mbps
- Supported formats: MP4, MOV

### 2. AutoPostingService

Manages the automated posting workflow and smart content selection.

**Key Features:**
- Smart video selection based on engagement data
- Duplicate content avoidance
- Category rotation (real-estate vs cartoon)
- Test mode for safe testing
- Engagement-based optimization

**Main Methods:**
```typescript
// Schedule posts for a user
schedulePosts(userId: string, days: number): Promise<PostingResult[]>

// Execute scheduled posts
executeScheduledPosts(): Promise<PostingResult[]>

// Select next video intelligently
selectNextVideo(userId: string, category: string, options: SmartPostingOptions)

// Get optimal posting times
getOptimalPostingTimes(userId: string): Promise<string[]>
```

**Posting Strategy:**
- 3 posts per day
- Alternating between real-estate and cartoon content
- Dynamic timing based on engagement data
- Cool-off periods to avoid over-posting

### 3. InstagramService

Handles Instagram API integration and posting functionality.

**Key Features:**
- Instagram Graph API integration
- Access token management
- Media upload and posting
- Account information retrieval
- Insights and analytics

**Main Methods:**
```typescript
// Post video to Instagram
postVideo(options: InstagramPostOptions): Promise<InstagramPostResult>

// Get account information
getAccountInfo(accessToken: string): Promise<InstagramAccountInfo>

// Refresh access token
refreshAccessToken(userId: string, currentToken: string): Promise<string>

// Get Instagram insights
getInsights(accessToken: string, days: number): Promise<any>
```

**Instagram API Features:**
- Video posting with captions and hashtags
- Engagement metrics tracking
- Account validation
- Rate limit handling
- Error recovery

### 4. CaptionGenerationService

AI-powered caption generation for real estate content.

**Key Features:**
- Template-based caption generation
- Category-specific hashtags
- Tone customization (professional, casual, funny, luxury)
- Emoji integration
- Call-to-action optimization

**Main Methods:**
```typescript
// Generate caption for video
generateCaption(options: CaptionGenerationOptions): Promise<GeneratedCaption>

// Get caption template
getCaptionTemplate(category: string, tone: string): Promise<CaptionTemplate>

// Generate hashtags
generateHashtags(category: string, tone: string): Promise<string[]>
```

**Caption Templates:**
- Real Estate Professional: "🏠 {propertyType} in {location} | {price} | {features}"
- Real Estate Casual: "Check out this amazing {propertyType} in {location}!"
- Cartoon Funny: "😂 Real estate agents be like... {funnyScenario}"
- Cartoon Professional: "Real estate humor: {scenario} | {lesson}"

### 5. AnalyticsService

Tracks engagement metrics and provides insights for optimization.

**Key Features:**
- Engagement rate calculation
- Posting time analysis
- Category performance tracking
- Trend analysis
- Recommendation generation

**Main Methods:**
```typescript
// Record post engagement
recordPostEngagement(postId: string, metrics: EngagementMetrics): Promise<void>

// Get user analytics
getUserAnalytics(userId: string, days: number): Promise<AnalyticsData>

// Get best posting times
getBestPostingTimes(userId: string, days: number): Promise<any>

// Get engagement insights
getEngagementInsights(userId: string, days: number): Promise<any>
```

**Analytics Metrics:**
- Likes, comments, shares
- Views, reach, impressions
- Engagement rate calculation
- Posting time performance
- Category comparison

### 6. SchedulerService

Manages automated posting schedules and timing optimization.

**Key Features:**
- Schedule management
- Timing optimization based on engagement
- Test mode support
- Schedule pause/resume
- Cleanup of old scheduled posts

**Main Methods:**
```typescript
// Schedule posts for user
schedulePosts(userId: string, days: number): Promise<ScheduleResult>

// Execute scheduled posts
executeScheduledPosts(): Promise<ScheduleResult>

// Optimize posting times
optimizePostingTimes(userId: string): Promise<TimingOptimization>

// Get schedule status
getScheduleStatus(userId: string): Promise<any>
```

**Scheduling Features:**
- Multiple posting times per day
- Category rotation
- Timezone support
- Test mode for safe testing
- Automatic optimization

## Service Integration

### Workflow Example

1. **Video Upload:**
   ```typescript
   const videoService = new VideoProcessingService();
   const result = await videoService.processVideo(filePath, userId, {
     generateThumbnail: true,
     compressVideo: true,
     maxDuration: 60,
     maxFileSize: 100
   });
   ```

2. **Caption Generation:**
   ```typescript
   const captionService = new CaptionGenerationService();
   const caption = await captionService.generateCaption({
     videoId: video.id,
     tone: 'professional',
     includeHashtags: true,
     maxLength: 2200
   });
   ```

3. **Post Scheduling:**
   ```typescript
   const autoPostingService = new AutoPostingService();
   const results = await autoPostingService.schedulePosts(userId, 7);
   ```

4. **Post Execution:**
   ```typescript
   const schedulerService = new SchedulerService();
   const results = await schedulerService.executeScheduledPosts();
   ```

5. **Analytics Tracking:**
   ```typescript
   const analyticsService = new AnalyticsService();
   await analyticsService.recordPostEngagement(postId, engagementMetrics);
   ```

## Error Handling

All services include comprehensive error handling:

- **Validation Errors:** Invalid video formats, missing data
- **API Errors:** Instagram API failures, rate limits
- **Processing Errors:** Video processing failures
- **Database Errors:** Connection issues, query failures

## Configuration

Services can be configured through environment variables:

```env
# Instagram API
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=your_redirect_uri

# Video Processing
MAX_VIDEO_DURATION=60
MAX_VIDEO_SIZE=100
VIDEO_QUALITY=high

# Posting Settings
DEFAULT_POSTING_TIMES=09:00,13:00,18:00
POSTS_PER_DAY=3
TEST_MODE=false
```

## Testing

Services include test mode functionality:

- **Test Mode:** Simulates posting without actual Instagram API calls
- **Mock Data:** Generates realistic engagement metrics
- **Safe Testing:** No real posts are made in test mode

## Performance Considerations

- **Video Processing:** Asynchronous processing with progress tracking
- **API Rate Limits:** Respects Instagram API rate limits
- **Database Optimization:** Efficient queries with proper indexing
- **Memory Management:** Proper cleanup of temporary files

## Security

- **Token Management:** Secure storage and refresh of Instagram tokens
- **File Validation:** Strict validation of uploaded video files
- **Access Control:** User-specific data isolation
- **Error Logging:** Secure logging without sensitive data exposure

## Monitoring

Services include comprehensive logging:

- **Performance Metrics:** Processing times, success rates
- **Error Tracking:** Detailed error logs with context
- **Usage Statistics:** Service usage and performance trends
- **Health Checks:** Service availability monitoring

## Future Enhancements

Planned improvements:

1. **Multi-Platform Support:** Extend to other social platforms
2. **Advanced AI:** More sophisticated caption generation
3. **Real-time Analytics:** Live engagement tracking
4. **A/B Testing:** Content performance testing
5. **Advanced Scheduling:** Machine learning-based timing optimization 