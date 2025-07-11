# Multi-Platform Implementation Guide

This document provides comprehensive guidance for implementing multi-platform posting to Instagram, TikTok, and YouTube.

## Overview

The Real Estate Auto-Posting App now supports posting to three major social media platforms:
- **Instagram** - Professional real estate content and lifestyle posts
- **TikTok** - Engaging short-form videos with viral potential
- **YouTube** - Longer-form content and YouTube Shorts

## Platform-Specific Requirements

### Instagram
- **Max Duration**: 60 seconds
- **Max File Size**: 100MB
- **Aspect Ratio**: 1:1 (square) or 4:5 (portrait)
- **API**: Instagram Graph API
- **Content Type**: Feed posts, Stories, Reels

### TikTok
- **Max Duration**: 3 minutes
- **Max File Size**: 287MB
- **Aspect Ratio**: 9:16 (vertical)
- **API**: TikTok Content Posting API
- **Content Type**: Short-form videos

### YouTube
- **Max Duration**: 60 seconds (for Shorts)
- **Max File Size**: 256MB
- **Aspect Ratio**: 9:16 (for Shorts)
- **API**: YouTube Data API v3
- **Content Type**: YouTube Shorts

## API Integration Examples

### Instagram Graph API Integration

```typescript
// Example Instagram posting implementation
async function postToInstagram(videoPath: string, caption: string, accessToken: string) {
  try {
    // Step 1: Create container
    const containerResponse = await fetch(`https://graph.facebook.com/v18.0/me/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: videoPath,
        caption: caption,
        access_token: accessToken,
      }),
    });

    const containerData = await containerResponse.json();
    const creationId = containerData.id;

    // Step 2: Publish the container
    const publishResponse = await fetch(`https://graph.facebook.com/v18.0/me/media_publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    });

    const publishData = await publishResponse.json();
    return publishData;
  } catch (error) {
    console.error('Instagram posting failed:', error);
    throw error;
  }
}
```

### TikTok Content Posting API Integration

```typescript
// Example TikTok posting implementation
async function postToTikTok(videoPath: string, title: string, accessToken: string) {
  try {
    // Step 1: Initialize upload
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        post_info: {
          title: title,
          privacy_level: 'public',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
      }),
    });

    const initData = await initResponse.json();
    const uploadUrl = initData.data.upload_url;

    // Step 2: Upload video
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
      },
      body: fs.createReadStream(videoPath),
    });

    // Step 3: Publish video
    const publishResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/publish/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        publish_id: initData.data.publish_id,
      }),
    });

    const publishData = await publishResponse.json();
    return publishData;
  } catch (error) {
    console.error('TikTok posting failed:', error);
    throw error;
  }
}
```

### YouTube Data API v3 Integration

```typescript
// Example YouTube posting implementation
async function postToYouTube(videoPath: string, title: string, description: string, accessToken: string) {
  try {
    // Step 1: Upload video
    const uploadResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'video/mp4',
      },
      body: JSON.stringify({
        snippet: {
          title: title,
          description: description,
          tags: ['real estate', 'luxury homes', 'property'],
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
        },
      }),
    });

    const uploadData = await uploadResponse.json();
    return uploadData;
  } catch (error) {
    console.error('YouTube posting failed:', error);
    throw error;
  }
}
```

## OAuth2 Implementation

### Instagram OAuth Flow

```typescript
// Instagram OAuth implementation
const instagramOAuth = {
  // Step 1: Redirect user to Instagram authorization
  getAuthUrl: (clientId: string, redirectUri: string, state: string) => {
    const scope = 'user_profile,user_media';
    return `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
  },

  // Step 2: Exchange code for access token
  exchangeCode: async (code: string, clientId: string, clientSecret: string, redirectUri: string) => {
    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    return response.json();
  },
};
```

### TikTok OAuth Flow

```typescript
// TikTok OAuth implementation
const tiktokOAuth = {
  // Step 1: Redirect user to TikTok authorization
  getAuthUrl: (clientKey: string, redirectUri: string, state: string) => {
    const scope = 'user.info.basic,video.list';
    return `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&state=${state}`;
  },

  // Step 2: Exchange code for access token
  exchangeCode: async (code: string, clientKey: string, clientSecret: string, redirectUri: string) => {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    return response.json();
  },
};
```

### YouTube OAuth Flow

```typescript
// YouTube OAuth implementation
const youtubeOAuth = {
  // Step 1: Redirect user to Google authorization
  getAuthUrl: (clientId: string, redirectUri: string, state: string) => {
    const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}&access_type=offline`;
  },

  // Step 2: Exchange code for access token
  exchangeCode: async (code: string, clientId: string, clientSecret: string, redirectUri: string) => {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    return response.json();
  },
};
```

## Platform-Specific Optimizations

### Instagram Optimizations

```typescript
// Instagram-specific optimizations
const instagramOptimizations = {
  // Optimal posting times (based on engagement data)
  optimalTimes: ['09:00', '13:00', '18:00'],
  
  // Hashtag strategy
  hashtags: {
    'real-estate': ['#realestate', '#luxuryhomes', '#property', '#homesforsale'],
    'cartoon': ['#realestatehumor', '#realtorlife', '#funny', '#cartoon'],
  },
  
  // Caption length limits
  maxCaptionLength: 2200,
  maxHashtags: 30,
  
  // Video requirements
  videoRequirements: {
    maxDuration: 60,
    maxFileSize: 100,
    aspectRatio: '1:1',
    recommendedBitrate: 2000,
  },
};
```

### TikTok Optimizations

```typescript
// TikTok-specific optimizations
const tiktokOptimizations = {
  // Optimal posting times (evening focus)
  optimalTimes: ['18:00', '20:00', '22:00'],
  
  // Hashtag strategy (include trending hashtags)
  hashtags: {
    'real-estate': ['#realestate', '#luxuryhomes', '#property', '#fyp', '#foryou'],
    'cartoon': ['#realestatehumor', '#realtorlife', '#funny', '#fyp', '#foryou'],
  },
  
  // Caption length limits
  maxCaptionLength: 150,
  maxHashtags: 20,
  
  // Video requirements
  videoRequirements: {
    maxDuration: 180,
    maxFileSize: 287,
    aspectRatio: '9:16',
    recommendedBitrate: 2500,
  },
};
```

### YouTube Optimizations

```typescript
// YouTube-specific optimizations
const youtubeOptimizations = {
  // Optimal posting times (afternoon/evening)
  optimalTimes: ['14:00', '16:00', '18:00'],
  
  // Title optimization
  titleTemplates: {
    'real-estate': [
      '{title} | Luxury Real Estate Tour',
      '{title} - Amazing Property in Central Texas',
      '{title} | Real Estate Agent Life',
    ],
    'cartoon': [
      '{title} | Real Estate Humor',
      '{title} - Realtor Life Cartoon',
      '{title} | Funny Real Estate Moments',
    ],
  },
  
  // Description optimization
  descriptionTemplate: (caption: string, hashtags: string[]) => {
    return `${caption}\n\n${hashtags.join(' ')}\n\n🔔 Subscribe for more real estate content!\n📧 Contact us for property inquiries`;
  },
  
  // Video requirements
  videoRequirements: {
    maxDuration: 60,
    maxFileSize: 256,
    aspectRatio: '9:16',
    recommendedBitrate: 3000,
  },
};
```

## Error Handling and Rate Limits

### Instagram Rate Limits
- **Posts per day**: 25
- **API calls per hour**: 200
- **Video upload size**: 100MB

### TikTok Rate Limits
- **Posts per day**: 10
- **API calls per hour**: 100
- **Video upload size**: 287MB

### YouTube Rate Limits
- **Posts per day**: 50
- **API calls per hour**: 10,000
- **Video upload size**: 256MB

```typescript
// Rate limiting implementation
class RateLimiter {
  private limits = {
    instagram: { posts: 25, calls: 200 },
    tiktok: { posts: 10, calls: 100 },
    youtube: { posts: 50, calls: 10000 },
  };

  async checkRateLimit(platform: string, userId: string): Promise<boolean> {
    // Implementation to check current usage against limits
    return true;
  }

  async incrementUsage(platform: string, userId: string): Promise<void> {
    // Implementation to increment usage counters
  }
}
```

## Security Best Practices

### Token Storage
```typescript
// Secure token storage
class TokenManager {
  private encryptToken(token: string): string {
    // Use strong encryption (AES-256)
    return encryptedToken;
  }

  private decryptToken(encryptedToken: string): string {
    // Decrypt token for API calls
    return decryptedToken;
  }

  async storeToken(userId: string, platform: string, token: string): Promise<void> {
    const encryptedToken = this.encryptToken(token);
    await database.updateUserTokens(userId, platform, encryptedToken);
  }
}
```

### API Key Management
```typescript
// Secure API key management
class ApiKeyManager {
  private keys = {
    instagram: process.env.INSTAGRAM_APP_SECRET,
    tiktok: process.env.TIKTOK_CLIENT_SECRET,
    youtube: process.env.YOUTUBE_CLIENT_SECRET,
  };

  getKey(platform: string): string {
    return this.keys[platform] || '';
  }
}
```

## Monitoring and Analytics

### Platform-Specific Metrics
```typescript
// Analytics tracking
interface PlatformMetrics {
  instagram: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    reach: number;
    impressions: number;
  };
  tiktok: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    downloads: number;
  };
  youtube: {
    views: number;
    likes: number;
    dislikes: number;
    comments: number;
    shares: number;
  };
}
```

## Legal Compliance

### Required Legal Pages
1. **Terms of Service**: `/terms`
2. **Privacy Policy**: `/privacy`
3. **API Status**: `/api-status`
4. **Compliance Check**: `/compliance`

### Platform-Specific Requirements
- **Instagram**: Requires app review and approval
- **TikTok**: Requires developer account and app approval
- **YouTube**: Requires Google Cloud project and API quota

## Testing and Development

### Test Mode Implementation
```typescript
// Test mode for safe development
const testMode = {
  enabled: process.env.TEST_MODE === 'true',
  
  simulatePosting: async (platform: string, content: any) => {
    if (!testMode.enabled) return realPosting(content);
    
    // Simulate posting with realistic delays and responses
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      success: Math.random() > 0.1,
      postId: `test_${platform}_${Date.now()}`,
      engagementMetrics: generateMockMetrics(platform),
    };
  },
};
```

## Deployment Checklist

### Environment Variables
- [ ] All API keys configured
- [ ] OAuth redirect URIs set
- [ ] Database connection established
- [ ] File storage configured
- [ ] Logging enabled

### Legal Requirements
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] API status endpoint available
- [ ] Compliance checks implemented

### Platform Approvals
- [ ] Instagram app approved
- [ ] TikTok developer account created
- [ ] YouTube API quota allocated
- [ ] OAuth flows tested

### Security Measures
- [ ] Token encryption implemented
- [ ] Rate limiting configured
- [ ] Error handling comprehensive
- [ ] Monitoring enabled

## Future Enhancements

1. **Additional Platforms**: Facebook, Twitter, LinkedIn
2. **Advanced Analytics**: Cross-platform performance comparison
3. **AI Optimization**: Machine learning for content optimization
4. **Real-time Monitoring**: Live engagement tracking
5. **A/B Testing**: Content performance testing
6. **Automated Scheduling**: Smart timing optimization 