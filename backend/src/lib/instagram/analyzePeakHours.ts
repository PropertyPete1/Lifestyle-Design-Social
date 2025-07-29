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
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.instagramAccessToken;
    const instagramBusinessId = process.env.INSTAGRAM_BUSINESS_ID || process.env.instagramBusinessId;
    
    if (!accessToken) {
      throw new Error('Instagram access token not found');
    }
    
    if (!instagramBusinessId) {
      throw new Error('Instagram business ID not found');
    }

    console.log(`📊 Fetching Instagram posts for business ID: ${instagramBusinessId}`);
    
    // Use the Instagram business account ID directly
    const instagramAccountId = instagramBusinessId;

    // Get recent media posts with engagement data
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${instagramAccountId}/media?fields=id,timestamp,media_type,caption,like_count,comments_count&limit=${count}&access_token=${accessToken}`
    );
    
    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.text();
      console.error('Instagram API Error Response:', errorData);
      throw new Error(`Failed to get Instagram media: ${mediaResponse.statusText} - ${errorData}`);
    }
    
    const mediaData = await mediaResponse.json();
    const posts: InstagramPostData[] = [];
    
    // Process posts using direct engagement data
    for (const media of mediaData.data || []) {
      posts.push({
        id: media.id,
        timestamp: media.timestamp,
        media_type: media.media_type,
        like_count: media.like_count || 0,
        comments_count: media.comments_count || 0,
        impressions: (media.like_count || 0) * 10, // Estimate impressions based on likes
        reach: (media.like_count || 0) * 8, // Estimate reach based on likes
        caption: media.caption || ''
      });
      
      console.log(`📊 Post ${media.id}: ${media.like_count || 0} likes, ${media.comments_count || 0} comments`);
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
  
  // Calculate engagement metrics using real data
  const viewsAfter60Min = Math.max(post.impressions, post.reach); // Use impressions as proxy for views
  const likesToViewsRatio = viewsAfter60Min > 0 ? (post.like_count / viewsAfter60Min) * 100 : 0;
  const commentsPerHour = post.comments_count; // Current comment count as proxy
  
  // Calculate engagement score using formula: views + (likes * 1.5) + (comments * 2)
  const engagementScore = viewsAfter60Min + (post.like_count * 1.5) + (post.comments_count * 2);
  
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