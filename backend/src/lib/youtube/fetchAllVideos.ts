import axios from 'axios';
import { connectToDatabase } from '../../database/connection';
import YouTubeVideo, { IYouTubeVideo } from '../../models/YouTubeVideo';
import * as fs from 'fs';
import * as path from 'path';

interface YouTubeVideoItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    tags?: string[];
  };
}

interface YouTubeVideoDetails {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    tags?: string[];
  };
  statistics: {
    viewCount: string;
    likeCount: string;
  };
}

export async function fetchAllVideosFromChannel(channelId: string): Promise<IYouTubeVideo[]> {
  await connectToDatabase();

  // Get YouTube API key from settings
  const settingsPath = path.resolve(__dirname, '../../../../frontend/settings.json');
  let apiKey = process.env.YOUTUBE_API_KEY;

  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      apiKey = settings.youtubeApiKey || apiKey;
    } catch (e) {
      // Ignore parse errors
    }
  }

  if (!apiKey) {
    throw new Error('YouTube API key not found. Please add it in Settings.');
  }

  const baseUrl = 'https://www.googleapis.com/youtube/v3';
  const savedVideos: IYouTubeVideo[] = [];
  let nextPageToken = '';
  let totalFetched = 0;

  try {
    do {
      // Step 1: Get list of video IDs from channel
      const searchUrl = `${baseUrl}/search?key=${apiKey}&channelId=${channelId}&part=id,snippet&order=date&type=video&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      console.log(`Fetching videos page ${totalFetched / 50 + 1}...`);
      const searchResponse = await axios.get(searchUrl);
      
      if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
        break;
      }

      const videoIds = searchResponse.data.items.map((item: YouTubeVideoItem) => item.id.videoId);
      
      // Step 2: Get detailed statistics for these videos
      const detailsUrl = `${baseUrl}/videos?key=${apiKey}&id=${videoIds.join(',')}&part=snippet,statistics`;
      const detailsResponse = await axios.get(detailsUrl);

      // Step 3: Process and save videos
      for (const video of detailsResponse.data.items as YouTubeVideoDetails[]) {
        try {
          // Check if video already exists
          const existingVideo = await YouTubeVideo.findOne({ videoId: video.id });
          
          if (existingVideo) {
            // Update existing video with latest stats
            existingVideo.viewCount = parseInt(video.statistics.viewCount) || 0;
            existingVideo.likeCount = parseInt(video.statistics.likeCount) || 0;
            await existingVideo.save();
            savedVideos.push(existingVideo);
          } else {
            // Create new video record
            const newVideo = new YouTubeVideo({
              videoId: video.id,
              title: video.snippet.title,
              description: video.snippet.description || '',
              tags: video.snippet.tags || [],
              viewCount: parseInt(video.statistics.viewCount) || 0,
              likeCount: parseInt(video.statistics.likeCount) || 0,
              publishedAt: video.snippet.publishedAt,
              alreadyPosted: false
            });

            await newVideo.save();
            savedVideos.push(newVideo);
          }
          
          totalFetched++;
        } catch (error) {
          console.error(`Error saving video ${video.id}:`, error);
        }
      }

      nextPageToken = searchResponse.data.nextPageToken;
      
      // Rate limiting - YouTube API has quota limits
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }

    } while (nextPageToken && totalFetched < 1000); // Limit to 1000 videos max per request

    console.log(`Successfully fetched ${totalFetched} videos from channel ${channelId}`);
    return savedVideos;

  } catch (error: any) {
    console.error('YouTube API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      throw new Error('YouTube API quota exceeded or invalid API key. Please check your API key and quota in Google Cloud Console.');
    } else if (error.response?.status === 404) {
      throw new Error('YouTube channel not found. Please check the Channel ID.');
    } else {
      throw new Error(`YouTube API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

export async function getAllSavedVideos(): Promise<IYouTubeVideo[]> {
  await connectToDatabase();
  return YouTubeVideo.find().sort({ viewCount: -1 }).exec();
} 