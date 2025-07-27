import axios from 'axios';
import PostInsight from '../models/PostInsights';
import TopHashtag from '../models/TopHashtags';

interface YouTubeVideoData {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnails: any;
}

interface YouTubeApiResponse {
  items: any[];
  nextPageToken?: string;
}

export class YouTubeScraper {
  private apiKey: string;
  private channelId: string;
  private refreshToken?: string;

  constructor(apiKey: string, channelId: string, refreshToken?: string) {
    this.apiKey = apiKey;
    this.channelId = channelId;
    this.refreshToken = refreshToken;
  }

  /**
   * Fetch top 20 performing videos from YouTube channel
   */
  async scrapeTopPerformingVideos(): Promise<YouTubeVideoData[]> {
    try {
      // First, get all videos from channel (up to 200 recent videos)
      const allVideos = await this.fetchChannelVideos();
      
      // Calculate performance scores and sort
      const videosWithScores = allVideos.map(video => ({
        ...video,
        performanceScore: this.calculatePerformanceScore(video)
      }));

      // Sort by performance score and return top 20
      const topVideos = videosWithScores
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 20);

      console.log(`Found ${topVideos.length} top performing YouTube videos`);
      return topVideos;
    } catch (error) {
      console.error('Error scraping YouTube videos:', error);
      throw error;
    }
  }

  /**
   * Fetch videos from YouTube channel
   */
  private async fetchChannelVideos(): Promise<YouTubeVideoData[]> {
    const videos: YouTubeVideoData[] = [];
    let nextPageToken = '';
    let maxResults = 50;
    let totalFetched = 0;

    try {
      // Get channel uploads playlist ID
      const channelResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${this.channelId}&key=${this.apiKey}`
      );

      const uploadsPlaylistId = channelResponse.data.items[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) {
        throw new Error('Could not find uploads playlist for channel');
      }

      // Fetch videos from uploads playlist
      while (totalFetched < 200) { // Limit to 200 videos for analysis
        const playlistResponse: YouTubeApiResponse = await axios.get(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&pageToken=${nextPageToken}&key=${this.apiKey}`
        ).then(res => res.data);

        if (!playlistResponse.items || playlistResponse.items.length === 0) {
          break;
        }

        // Get video IDs
        const videoIds = playlistResponse.items.map(item => item.snippet.resourceId.videoId);

        // Fetch detailed video statistics
        const videoDetailsResponse = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(',')}&key=${this.apiKey}`
        );

        // Process video data
        for (const video of videoDetailsResponse.data.items) {
          videos.push({
            videoId: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            publishedAt: video.snippet.publishedAt,
            viewCount: parseInt(video.statistics.viewCount || '0'),
            likeCount: parseInt(video.statistics.likeCount || '0'),
            commentCount: parseInt(video.statistics.commentCount || '0'),
            thumbnails: video.snippet.thumbnails
          });
        }

        totalFetched += playlistResponse.items.length;
        nextPageToken = playlistResponse.nextPageToken || '';

        if (!nextPageToken) break;
      }

      return videos;
    } catch (error) {
      console.error('Error fetching YouTube channel videos:', error);
      throw error;
    }
  }

  /**
   * Calculate performance score based on views, likes, comments
   */
  private calculatePerformanceScore(video: YouTubeVideoData): number {
    const { viewCount, likeCount, commentCount } = video;
    
    // Weighted scoring: views (40%), likes (35%), comments (25%)
    const viewScore = viewCount * 0.4;
    const likeScore = likeCount * 35; // Weight likes higher per unit
    const commentScore = commentCount * 25; // Weight comments highest per unit
    
    return Math.round(viewScore + likeScore + commentScore);
  }

  /**
   * Extract hashtags from video description
   */
  private extractHashtags(description: string): string[] {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const hashtags = description.match(hashtagRegex) || [];
    return hashtags.map(tag => tag.toLowerCase());
  }

  /**
   * Save scraped videos to PostInsights collection
   */
  async saveVideoInsights(videos: YouTubeVideoData[]): Promise<void> {
    try {
      for (const video of videos) {
        const hashtags = this.extractHashtags(video.description);
        const performanceScore = this.calculatePerformanceScore(video);

        // Check if video already exists
        const existingInsight = await PostInsight.findOne({ videoId: video.videoId });
        
        if (!existingInsight) {
          await PostInsight.create({
            platform: 'youtube',
            videoId: video.videoId,
            caption: video.description || video.title || 'No description available',
            hashtags,
            performanceScore,
            repostEligible: true,
            reposted: false,
            originalPostDate: new Date(video.publishedAt),
            views: video.viewCount,
            likes: video.likeCount,
            comments: video.commentCount,
            title: video.title
          });
        } else {
          // Update existing record with latest stats
          await PostInsight.findByIdAndUpdate(existingInsight._id, {
            views: video.viewCount,
            likes: video.likeCount,
            comments: video.commentCount,
            performanceScore,
            scrapedAt: new Date()
          });
        }
      }

      console.log(`Saved ${videos.length} YouTube video insights to database`);
    } catch (error) {
      console.error('Error saving YouTube video insights:', error);
      throw error;
    }
  }

  /**
   * Update top hashtags based on scraped videos
   */
  async updateTopHashtags(): Promise<void> {
    try {
      // Get all YouTube videos from PostInsights
      const youtubeVideos = await PostInsight.find({ platform: 'youtube' });
      
      // Aggregate hashtag data
      const hashtagStats = new Map<string, {
        usageCount: number;
        totalViews: number;
        totalLikes: number;
        videos: any[];
      }>();

      for (const video of youtubeVideos) {
        for (const hashtag of video.hashtags) {
          if (!hashtagStats.has(hashtag)) {
            hashtagStats.set(hashtag, {
              usageCount: 0,
              totalViews: 0,
              totalLikes: 0,
              videos: []
            });
          }

          const stats = hashtagStats.get(hashtag)!;
          stats.usageCount++;
          stats.totalViews += video.views || 0;
          stats.totalLikes += video.likes || 0;
          stats.videos.push(video);
        }
      }

      // Update TopHashtags collection
      for (const [hashtag, stats] of Array.from(hashtagStats.entries())) {
        const avgViewScore = stats.usageCount > 0 ? stats.totalViews / stats.usageCount : 0;
        
        await TopHashtag.findOneAndUpdate(
          { hashtag },
          {
            hashtag,
            usageCount: stats.usageCount,
            avgViewScore,
            platform: 'youtube',
            totalViews: stats.totalViews,
            totalLikes: stats.totalLikes,
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
      }

      console.log(`Updated ${hashtagStats.size} YouTube hashtags in TopHashtags collection`);
    } catch (error) {
      console.error('Error updating YouTube top hashtags:', error);
      throw error;
    }
  }

  /**
   * Full scraping process: fetch videos, save insights, update hashtags
   */
  async performFullScrape(): Promise<{
    videosScraped: number;
    hashtagsUpdated: number;
  }> {
    try {
      console.log('Starting YouTube scraping process...');
      
      // 1. Scrape top performing videos
      const topVideos = await this.scrapeTopPerformingVideos();
      
      // 2. Save video insights
      await this.saveVideoInsights(topVideos);
      
      // 3. Update hashtag analytics
      await this.updateTopHashtags();
      
      // 4. Get hashtag count for return
      const hashtagCount = await TopHashtag.countDocuments({ platform: 'youtube' });
      
      console.log('YouTube scraping process completed successfully');
      
      return {
        videosScraped: topVideos.length,
        hashtagsUpdated: hashtagCount
      };
    } catch (error) {
      console.error('Error in YouTube full scrape process:', error);
      throw error;
    }
  }
} 