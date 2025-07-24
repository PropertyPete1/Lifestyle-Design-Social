import { connectToDatabase } from '../../database/connection';
import YouTubeVideo, { IYouTubeVideo } from '../../models/YouTubeVideo';
import YouTubeInsight, { IYouTubeInsight } from '../../models/YouTubeInsight';

interface HashtagAnalysis {
  [hashtag: string]: {
    appearances: number;
    totalViews: number;
    videos: string[];
  };
}

export async function analyzeTopHashtags(): Promise<IYouTubeInsight[]> {
  await connectToDatabase();

  // Get all videos sorted by view count
  const videos = await YouTubeVideo.find().sort({ viewCount: -1 }).exec();

  if (videos.length === 0) {
    throw new Error('No YouTube videos found. Please scrape videos first.');
  }

  console.log(`Analyzing hashtags from ${videos.length} videos...`);

  const hashtagAnalysis: HashtagAnalysis = {};

  // Extract hashtags from video descriptions and tags
  for (const video of videos) {
    const allText = `${video.title} ${video.description} ${video.tags.join(' ')}`;
    const hashtags = extractHashtags(allText);

    for (const hashtag of hashtags) {
      const cleanTag = hashtag.toLowerCase().replace('#', '');
      
      if (cleanTag.length > 2) { // Filter out very short hashtags
        if (!hashtagAnalysis[cleanTag]) {
          hashtagAnalysis[cleanTag] = {
            appearances: 0,
            totalViews: 0,
            videos: []
          };
        }

        hashtagAnalysis[cleanTag].appearances += 1;
        hashtagAnalysis[cleanTag].totalViews += video.viewCount;
        hashtagAnalysis[cleanTag].videos.push(video.videoId);
      }
    }
  }

  console.log(`Found ${Object.keys(hashtagAnalysis).length} unique hashtags`);

  // Calculate average view count for each hashtag and create insights
  const insights: IYouTubeInsight[] = [];

  for (const [tag, data] of Object.entries(hashtagAnalysis)) {
    if (data.appearances >= 2) { // Only include hashtags that appear in at least 2 videos
      const avgViewCount = Math.round(data.totalViews / data.appearances);

      try {
        // Update or create insight record
        const existingInsight = await YouTubeInsight.findOne({ tag });

        if (existingInsight) {
          existingInsight.appearances = data.appearances;
          existingInsight.avgViewCount = avgViewCount;
          await existingInsight.save();
          insights.push(existingInsight);
        } else {
          const newInsight = new YouTubeInsight({
            tag,
            appearances: data.appearances,
            avgViewCount
          });

          await newInsight.save();
          insights.push(newInsight);
        }
      } catch (error) {
        console.error(`Error saving insight for tag "${tag}":`, error);
      }
    }
  }

  // Sort insights by performance score (combination of avg views and appearances)
  insights.sort((a, b) => {
    const scoreA = (a.avgViewCount * 0.7) + (a.appearances * 1000 * 0.3);
    const scoreB = (b.avgViewCount * 0.7) + (b.appearances * 1000 * 0.3);
    return scoreB - scoreA;
  });

  console.log(`Analyzed ${insights.length} hashtags with performance data`);
  return insights;
}

function extractHashtags(text: string): string[] {
  // Match hashtags in text (word starting with #)
  const hashtagRegex = /#[\w]+/g;
  const matches: string[] = text.match(hashtagRegex) || [];
  
  // Also look for common hashtag patterns without # symbol
  const commonKeywords = [
    'realestate', 'realtor', 'property', 'house', 'home', 'investment',
    'luxury', 'listing', 'sold', 'mortgage', 'agent', 'broker',
    'lifestyle', 'design', 'interior', 'architecture', 'renovation',
    'firsttimehomebuyer', 'dreamhome', 'househunting', 'openhouse',
    'commercial', 'residential', 'condo', 'apartment', 'villa'
  ];

  const lowercaseText = text.toLowerCase();
  for (const keyword of commonKeywords) {
    if (lowercaseText.includes(keyword) && !matches.find(m => m.toLowerCase().includes(keyword))) {
      matches.push(`#${keyword}`);
    }
  }

  // Remove duplicates and return
  return [...new Set(matches)];
}

export async function getTopInsights(limit: number = 50): Promise<IYouTubeInsight[]> {
  await connectToDatabase();
  
  return YouTubeInsight
    .find()
    .sort({ avgViewCount: -1, appearances: -1 })
    .limit(limit)
    .exec();
}

export async function clearAllInsights(): Promise<void> {
  await connectToDatabase();
  await YouTubeInsight.deleteMany({});
  console.log('Cleared all YouTube insights');
} 