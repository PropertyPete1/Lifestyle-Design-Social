import PeakEngagementTimes from '../../models/PeakEngagementTimes';

interface InstagramPostData {
  id: string;
  timestamp: string;
  media_type: string;
  like_count: number;
  comments_count: number;
  impressions: number;
  reach: number;
  caption: string;
}

interface EngagementMetrics {
  postTime: Date;
  hour: number;
  dayOfWeek: string;
  viewsAfter60Min: number;
  likesToViewsRatio: number;
  commentsPerHour: number;
  engagementScore: number;
}

export async function analyzePeakHours(): Promise<void> {
  try {
    console.log('🕒 Starting Instagram Peak Hours Analysis...');
    
    // Get Instagram posts from last 60 posts
    const posts = await fetchLastInstagramPosts(60);
    
    if (posts.length === 0) {
      console.log('❌ No Instagram posts found for analysis');
      return;
    }

    console.log(`📊 Analyzing ${posts.length} Instagram posts for peak hours...`);
    
    // Calculate engagement metrics for each post
    const metrics = posts.map(post => calculateEngagementMetrics(post));
    
    // Group by day of week and hour
    const groupedMetrics = groupMetricsByTimeSlot(metrics);
    
    // Calculate average scores and update database
    await updatePeakEngagementTimes(groupedMetrics, 'instagram');
    
    console.log('✅ Instagram Peak Hours Analysis completed successfully');
    
  } catch (error) {
    console.error('❌ Error analyzing Instagram peak hours:', error);
    throw error;
  }
}

async function fetchLastInstagramPosts(count: number): Promise<InstagramPostData[]> {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;
    
    if (!accessToken || !pageId) {
      throw new Error('Instagram access token or page ID not found');
    }

    // Get Instagram account ID from Facebook Page
    const pageResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
    );
    
    if (!pageResponse.ok) {
      throw new Error(`Failed to get Instagram account: ${pageResponse.statusText}`);
    }
    
    const pageData = await pageResponse.json();
    const instagramAccountId = pageData.instagram_business_account?.id;
    
    if (!instagramAccountId) {
      throw new Error('Instagram business account not found');
    }

    // Get recent media posts
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${instagramAccountId}/media?fields=id,timestamp,media_type,caption&limit=${count}&access_token=${accessToken}`
    );
    
    if (!mediaResponse.ok) {
      throw new Error(`Failed to get Instagram media: ${mediaResponse.statusText}`);
    }
    
    const mediaData = await mediaResponse.json();
    const posts: InstagramPostData[] = [];
    
    // Get insights for each post
    for (const media of mediaData.data || []) {
      try {
        const insightsResponse = await fetch(
          `https://graph.facebook.com/v21.0/${media.id}/insights?metric=impressions,reach,likes,comments&access_token=${accessToken}`
        );
        
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          const insights = insightsData.data || [];
          
          const impressions = insights.find((i: any) => i.name === 'impressions')?.values[0]?.value || 0;
          const reach = insights.find((i: any) => i.name === 'reach')?.values[0]?.value || 0;
          const likes = insights.find((i: any) => i.name === 'likes')?.values[0]?.value || 0;
          const comments = insights.find((i: any) => i.name === 'comments')?.values[0]?.value || 0;
          
          posts.push({
            id: media.id,
            timestamp: media.timestamp,
            media_type: media.media_type,
            like_count: likes,
            comments_count: comments,
            impressions,
            reach,
            caption: media.caption || ''
          });
        }
      } catch (error) {
        console.warn(`Failed to get insights for post ${media.id}:`, error);
        // Add post without insights
        posts.push({
          id: media.id,
          timestamp: media.timestamp,
          media_type: media.media_type,
          like_count: 0,
          comments_count: 0,
          impressions: 0,
          reach: 0,
          caption: media.caption || ''
        });
      }
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return posts;
    
  } catch (error) {
    console.error('❌ Error fetching Instagram posts:', error);
    return [];
  }
}

function calculateEngagementMetrics(post: InstagramPostData): EngagementMetrics {
  const postTime = new Date(post.timestamp);
  const hour = postTime.getHours();
  const dayOfWeek = postTime.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Calculate engagement metrics
  const viewsAfter60Min = Math.max(post.impressions, post.reach); // Use impressions as proxy for views
  const likesToViewsRatio = viewsAfter60Min > 0 ? (post.like_count / viewsAfter60Min) * 100 : 0;
  const commentsPerHour = post.comments_count; // Approximation - would need hourly breakdown
  
  // Calculate composite engagement score (0-100)
  const engagementScore = Math.min(100, (
    (likesToViewsRatio * 35) + // 35% weight on like ratio
    (Math.min(post.comments_count / 5, 25)) + // 25% weight on comments (capped)
    (Math.min(viewsAfter60Min / 500, 25)) + // 25% weight on views (normalized)
    (Math.min(post.reach / 300, 15)) // 15% weight on reach (normalized)
  ));
  
  return {
    postTime,
    hour,
    dayOfWeek,
    viewsAfter60Min,
    likesToViewsRatio,
    commentsPerHour,
    engagementScore
  };
}

function groupMetricsByTimeSlot(metrics: EngagementMetrics[]): Map<string, EngagementMetrics[]> {
  const grouped = new Map<string, EngagementMetrics[]>();
  
  metrics.forEach(metric => {
    const key = `${metric.dayOfWeek}-${metric.hour}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(metric);
  });
  
  return grouped;
}

async function updatePeakEngagementTimes(
  groupedMetrics: Map<string, EngagementMetrics[]>, 
  platform: 'youtube' | 'instagram'
): Promise<void> {
  const updates = [];
  
  for (const [key, metrics] of groupedMetrics) {
    const [dayOfWeek, hourStr] = key.split('-');
    const hour = parseInt(hourStr);
    
    const avgScore = metrics.reduce((sum, m) => sum + m.engagementScore, 0) / metrics.length;
    const totalPosts = metrics.length;
    
    updates.push({
      updateOne: {
        filter: { platform, dayOfWeek, hour },
        update: {
          $set: {
            avgScore: Math.round(avgScore * 100) / 100, // Round to 2 decimal places
            totalPosts,
            lastUpdated: new Date()
          }
        },
        upsert: true
      }
    });
  }
  
  if (updates.length > 0) {
    await PeakEngagementTimes.bulkWrite(updates);
    console.log(`📊 Updated ${updates.length} peak engagement time slots for ${platform}`);
  }
}

export async function getOptimalPostingTimes(platform: 'youtube' | 'instagram', limit: number = 5) {
  try {
    const peakTimes = await PeakEngagementTimes
      .find({ platform })
      .sort({ avgScore: -1 })
      .limit(limit)
      .lean();
    
    return peakTimes.map(time => ({
      dayOfWeek: time.dayOfWeek,
      hour: time.hour,
      score: time.avgScore,
      totalPosts: time.totalPosts,
      timeSlot: `${time.dayOfWeek} ${formatHour(time.hour)}`
    }));
    
  } catch (error) {
    console.error(`❌ Error getting optimal posting times for ${platform}:`, error);
    return [];
  }
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${ampm}`;
} 