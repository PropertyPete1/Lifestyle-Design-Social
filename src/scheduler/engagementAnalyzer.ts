import { db } from '../lib/db/mongoClient';

// Type definitions for analytics data
interface PostLog {
  timestamp: Date;
  views: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

interface ViewerActivity {
  timestamp: Date;
  activeViewers: number;
}

// Mock data functions since the actual analytics modules don't have the required functions
async function getPostLogs(): Promise<PostLog[]> {
  // This would typically fetch from MongoDB
  const logs = await db.collection("daily_metrics").find().toArray();
  return logs.map(log => ({
    timestamp: log.trackedAt,
    views: log.views || 0,
    likes: log.likes || 0,
    comments: log.comments || 0
  }));
}

async function getViewerActivity(): Promise<ViewerActivity[]> {
  // This would typically fetch from MongoDB
  const activity = await db.collection("viewer_engagement").find().toArray();
  return activity.map(entry => ({
    timestamp: new Date(),
    activeViewers: entry.views || 0
  }));
}

export async function calculatePeakHours(): Promise<number[]> {
  const logs = await getPostLogs();
  const activity = await getViewerActivity();

  const hourBuckets: Record<number, number> = {};

  logs.forEach((log: PostLog) => {
    const hour = new Date(log.timestamp).getHours();
    hourBuckets[hour] = (hourBuckets[hour] || 0) + log.views;
  });

  activity.forEach((entry: ViewerActivity) => {
    const hour = new Date(entry.timestamp).getHours();
    hourBuckets[hour] = (hourBuckets[hour] || 0) + entry.activeViewers;
  });

  const sortedHours = Object.entries(hourBuckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  return sortedHours;
}

export async function calculateOptimalPostingTimes(): Promise<{
  peakHours: number[];
  bestDays: string[];
  engagementScore: Record<string, number>;
}> {
  const logs = await getPostLogs();
  const activity = await getViewerActivity();

  // Analyze by hour
  const hourBuckets: Record<number, number> = {};
  const dayBuckets: Record<string, number> = {};
  const engagementByTime: Record<string, number> = {};

  logs.forEach((log: PostLog) => {
    const date = new Date(log.timestamp);
    const hour = date.getHours();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const timeKey = `${day}-${hour}`;

    hourBuckets[hour] = (hourBuckets[hour] || 0) + log.views;
    dayBuckets[day] = (dayBuckets[day] || 0) + log.views;
    engagementByTime[timeKey] = (engagementByTime[timeKey] || 0) + log.views;
  });

  activity.forEach((entry: ViewerActivity) => {
    const date = new Date(entry.timestamp);
    const hour = date.getHours();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const timeKey = `${day}-${hour}`;

    hourBuckets[hour] = (hourBuckets[hour] || 0) + entry.activeViewers;
    dayBuckets[day] = (dayBuckets[day] || 0) + entry.activeViewers;
    engagementByTime[timeKey] = (engagementByTime[timeKey] || 0) + entry.activeViewers;
  });

  // Get top 3 peak hours
  const peakHours = Object.entries(hourBuckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Get top 3 best days
  const bestDays = Object.entries(dayBuckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day]) => day);

  return {
    peakHours,
    bestDays,
    engagementScore: engagementByTime
  };
}

export async function getEngagementTrends(): Promise<{
  weeklyTrend: number[];
  hourlyTrend: number[];
  topPerformingTimes: Array<{ day: string; hour: number; score: number }>;
}> {
  const logs = await getPostLogs();
  const activity = await getViewerActivity();

  // Weekly trend (last 7 days)
  const weeklyTrend: number[] = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const dayViews = logs
      .filter((log: PostLog) => {
        const logDate = new Date(log.timestamp);
        return logDate >= dayStart && logDate <= dayEnd;
      })
      .reduce((sum: number, log: PostLog) => sum + log.views, 0);

    weeklyTrend.push(dayViews);
  }

  // Hourly trend (24 hours)
  const hourlyTrend: number[] = [];
  const hourBuckets: Record<number, number> = {};

  logs.forEach((log: PostLog) => {
    const hour = new Date(log.timestamp).getHours();
    hourBuckets[hour] = (hourBuckets[hour] || 0) + log.views;
  });

  activity.forEach((entry: ViewerActivity) => {
    const hour = new Date(entry.timestamp).getHours();
    hourBuckets[hour] = (hourBuckets[hour] || 0) + entry.activeViewers;
  });

  for (let hour = 0; hour < 24; hour++) {
    hourlyTrend.push(hourBuckets[hour] || 0);
  }

  // Top performing times
  const timeBuckets: Record<string, number> = {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  logs.forEach((log) => {
    const date = new Date(log.timestamp);
    const day = days[date.getDay()];
    const hour = date.getHours();
    const key = `${day}-${hour}`;
    timeBuckets[key] = (timeBuckets[key] || 0) + log.views;
  });

  activity.forEach((entry) => {
    const date = new Date(entry.timestamp);
    const day = days[date.getDay()];
    const hour = date.getHours();
    const key = `${day}-${hour}`;
    timeBuckets[key] = (timeBuckets[key] || 0) + entry.activeViewers;
  });

  const topPerformingTimes = Object.entries(timeBuckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, score]) => {
      const [day, hour] = key.split('-');
      return { day, hour: parseInt(hour), score };
    });

  return {
    weeklyTrend,
    hourlyTrend,
    topPerformingTimes
  };
}

export async function calculateOptimalSchedule(): Promise<{
  recommendedTimes: Array<{ day: string; hour: number; confidence: number }>;
  nextBestTime: { day: string; hour: number };
  scheduleScore: number;
}> {
  const { peakHours, bestDays, engagementScore } = await calculateOptimalPostingTimes();
  const { topPerformingTimes } = await getEngagementTrends();

  // Calculate recommended times based on peak hours and best days
  const recommendedTimes: Array<{ day: string; hour: number; confidence: number }> = [];

  bestDays.forEach((day, dayIndex) => {
    peakHours.forEach((hour, hourIndex) => {
      const timeKey = `${day}-${hour}`;
      const score = engagementScore[timeKey] || 0;
      const maxScore = Math.max(...Object.values(engagementScore));
      const confidence = score / maxScore;

      recommendedTimes.push({
        day,
        hour,
        confidence: Math.round(confidence * 100) / 100
      });
    });
  });

  // Sort by confidence
  recommendedTimes.sort((a, b) => b.confidence - a.confidence);

  // Find next best time (next available slot)
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = now.getHours();

  let nextBestTime = { day: currentDay, hour: currentHour + 1 };
  
  // Find the next available optimal time
  for (const time of recommendedTimes) {
    if (time.day === currentDay && time.hour > currentHour) {
      nextBestTime = { day: time.day, hour: time.hour };
      break;
    } else if (time.day !== currentDay) {
      nextBestTime = { day: time.day, hour: time.hour };
      break;
    }
  }

  // Calculate overall schedule score
  const totalEngagement = Object.values(engagementScore).reduce((sum, score) => sum + score, 0);
  const avgEngagement = totalEngagement / Object.keys(engagementScore).length;
  const scheduleScore = Math.round((avgEngagement / 1000) * 100) / 100; // Normalize to 0-1

  return {
    recommendedTimes: recommendedTimes.slice(0, 5), // Top 5 recommendations
    nextBestTime,
    scheduleScore
  };
}

export async function getEngagementInsights(): Promise<{
  totalViews: number;
  avgViewsPerPost: number;
  bestPerformingHour: number;
  bestPerformingDay: string;
  engagementGrowth: number;
}> {
  const logs = await getPostLogs();
  const activity = await getViewerActivity();

  const totalViews = logs.reduce((sum, log) => sum + log.views, 0);
  const avgViewsPerPost = logs.length > 0 ? totalViews / logs.length : 0;

  // Find best performing hour
  const hourBuckets: Record<number, number> = {};
  logs.forEach((log) => {
    const hour = new Date(log.timestamp).getHours();
    hourBuckets[hour] = (hourBuckets[hour] || 0) + log.views;
  });

  const bestPerformingHour = Object.entries(hourBuckets)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

  // Find best performing day
  const dayBuckets: Record<string, number> = {};
  logs.forEach((log) => {
    const day = new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
    dayBuckets[day] = (dayBuckets[day] || 0) + log.views;
  });

  const bestPerformingDay = Object.entries(dayBuckets)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

  // Calculate engagement growth (comparing last 7 days vs previous 7 days)
  const now = new Date();
  const lastWeek = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return logDate >= weekAgo;
  });

  const previousWeek = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return logDate >= twoWeeksAgo && logDate < weekAgo;
  });

  const lastWeekViews = lastWeek.reduce((sum, log) => sum + log.views, 0);
  const previousWeekViews = previousWeek.reduce((sum, log) => sum + log.views, 0);
  
  const engagementGrowth = previousWeekViews > 0 
    ? ((lastWeekViews - previousWeekViews) / previousWeekViews) * 100 
    : 0;

  return {
    totalViews,
    avgViewsPerPost: Math.round(avgViewsPerPost * 100) / 100,
    bestPerformingHour: parseInt(bestPerformingHour.toString()),
    bestPerformingDay,
    engagementGrowth: Math.round(engagementGrowth * 100) / 100
  };
} 