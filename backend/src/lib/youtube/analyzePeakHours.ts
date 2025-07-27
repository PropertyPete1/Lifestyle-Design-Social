import { google } from 'googleapis';
import PeakEngagementTimes from '../../models/PeakEngagementTimes';

interface YouTubeVideoData {
  id: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  title: string;
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
    console.log('🕒 Starting YouTube Peak Hours Analysis...');
    
    // Get YouTube videos from last 60 posts
    const videos = await fetchLastYouTubeVideos(60);
    
    if (videos.length === 0) {
      console.log('❌ No YouTube videos found for analysis');
      return;
    }

    console.log(`📊 Analyzing ${videos.length} YouTube videos for peak hours...`);
    
    // Calculate engagement metrics for each video
    const metrics = videos.map(video => calculateEngagementMetrics(video));
    
    // Group by day of week and hour
    const groupedMetrics = groupMetricsByTimeSlot(metrics);
    
    // Calculate average scores and update database
    await updatePeakEngagementTimes(groupedMetrics, 'youtube');
    
    console.log('✅ YouTube Peak Hours Analysis completed successfully');
    
  } catch (error) {
    console.error('❌ Error analyzing YouTube peak hours:', error);
    throw error;
  }
}

async function fetchLastYouTubeVideos(count: number): Promise<YouTubeVideoData[]> {
  try {
    const youtube = google.youtube('v3');
    const API_KEY = process.env.YOUTUBE_API_KEY;
    
    if (!API_KEY) {
      throw new Error('YouTube API key not found');
    }

    // Get channel uploads playlist
    const channelsResponse = await youtube.channels.list({
      key: API_KEY,
      part: ['contentDetails'],
      mine: true
    });

    if (!channelsResponse.data.items?.length) {
      throw new Error('No YouTube channel found');
    }

    const uploadsPlaylistId = channelsResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
    
    if (!uploadsPlaylistId) {
      throw new Error('Uploads playlist not found');
    }

    // Get last 60 videos from uploads playlist
    const playlistResponse = await youtube.playlistItems.list({
      key: API_KEY,
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults: count
    });

    const videoIds = playlistResponse.data.items?.map(item => item.snippet?.resourceId?.videoId).filter((id): id is string => Boolean(id)) || [];
    
    if (videoIds.length === 0) {
      return [];
    }

    // Get detailed video statistics
    const videosResponse = await youtube.videos.list({
      key: API_KEY,
      part: ['snippet', 'statistics'],
      id: videoIds
    });

    return videosResponse.data.items?.map((video: any) => ({
      id: video.id!,
      publishedAt: video.snippet?.publishedAt!,
      viewCount: parseInt(video.statistics?.viewCount || '0'),
      likeCount: parseInt(video.statistics?.likeCount || '0'),
      commentCount: parseInt(video.statistics?.commentCount || '0'),
      title: video.snippet?.title || ''
    })) || [];

  } catch (error) {
    console.error('❌ Error fetching YouTube videos:', error);
    return [];
  }
}

function calculateEngagementMetrics(video: YouTubeVideoData): EngagementMetrics {
  const postTime = new Date(video.publishedAt);
  const hour = postTime.getHours();
  const dayOfWeek = postTime.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Calculate engagement metrics
  const viewsAfter60Min = video.viewCount; // Approximation - actual 60min data would need historical tracking
  const likesToViewsRatio = video.viewCount > 0 ? (video.likeCount / video.viewCount) * 100 : 0;
  const commentsPerHour = video.commentCount; // Approximation - would need hourly breakdown
  
  // Calculate composite engagement score (0-100)
  const engagementScore = Math.min(100, (
    (likesToViewsRatio * 40) + // 40% weight on like ratio
    (Math.min(video.commentCount / 10, 30)) + // 30% weight on comments (capped)
    (Math.min(video.viewCount / 1000, 30)) // 30% weight on views (normalized)
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