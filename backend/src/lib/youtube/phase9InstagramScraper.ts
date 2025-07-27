import axios from 'axios';
import { InstagramContent, IInstagramContent } from '../../models/InstagramContent';
import { RepostQueue } from '../../models/RepostQueue';
import fs from 'fs';
import path from 'path';

interface InstagramMediaResponse {
  data: Array<{
    id: string;
    caption?: string;
    media_type: 'VIDEO' | 'IMAGE' | 'CAROUSEL_ALBUM';
    media_url: string;
    permalink: string;
    timestamp: string;
    insights?: {
      data: Array<{
        name: string;
        values: Array<{ value: number }>;
      }>;
    };
  }>;
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

interface InstagramInsightsResponse {
  data: Array<{
    name: string;
    values: Array<{ value: number }>;
  }>;
}

export class Phase9InstagramScraper {
  private accessToken: string;
  private businessAccountId: string;
  private maxPosts: number = 500;

  constructor(accessToken: string, businessAccountId: string) {
    this.accessToken = accessToken;
    this.businessAccountId = businessAccountId;
  }

  /**
   * Scrape 500 most recent Instagram posts and store in database
   */
  async scrapeRecentPosts(): Promise<{ success: boolean; postsScraped: number; topPerformers: number; error?: string }> {
    try {
      console.log('🔍 Phase 9: Starting Instagram scraper for 500 recent posts...');
      
      const allPosts: any[] = [];
      let nextUrl: string | undefined;
      let requestCount = 0;
      const maxRequests = 10; // Safety limit

      // Initial request
      const baseUrl = `https://graph.facebook.com/v18.0/${this.businessAccountId}/media`;
      const fields = 'id,caption,media_type,media_url,permalink,timestamp';
      let currentUrl = `${baseUrl}?fields=${fields}&limit=50&access_token=${this.accessToken}`;

      while (allPosts.length < this.maxPosts && requestCount < maxRequests) {
        console.log(`📊 Fetching batch ${requestCount + 1}, current count: ${allPosts.length}`);
        
        const response = await axios.get(currentUrl);
        const mediaData: InstagramMediaResponse = response.data;

        if (!mediaData.data || mediaData.data.length === 0) {
          console.log('📭 No more posts available');
          break;
        }

        // Filter for videos only (Reels content)
        const videoPosts = mediaData.data.filter(post => post.media_type === 'VIDEO');
        allPosts.push(...videoPosts);

        // Check if we have next page
        if (!mediaData.paging?.next || allPosts.length >= this.maxPosts) {
          break;
        }

        currentUrl = mediaData.paging.next;
        requestCount++;

        // Rate limiting - be nice to Instagram API
        await this.delay(200);
      }

      console.log(`📱 Found ${allPosts.length} video posts. Processing insights...`);

      // Process each post to get insights and calculate performance score
      let processedCount = 0;
      const batchSize = 10;

      for (let i = 0; i < Math.min(allPosts.length, this.maxPosts); i += batchSize) {
        const batch = allPosts.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (post) => {
          try {
            const insights = await this.getPostInsights(post.id);
            const processedPost = await this.processPost(post, insights);
            
            if (processedPost) {
              processedCount++;
            }
          } catch (error) {
            console.error(`❌ Error processing post ${post.id}:`, error);
          }
        }));

        // Rate limiting between batches
        await this.delay(1000);
      }

      // Identify top 50 performers and add to repost queue
      const topPerformers = await this.identifyTopPerformers();
      
      console.log(`✅ Phase 9 Instagram scraping complete:`);
      console.log(`   📊 Posts processed: ${processedCount}`);
      console.log(`   🏆 Top performers identified: ${topPerformers}`);

      return {
        success: true,
        postsScraped: processedCount,
        topPerformers
      };

    } catch (error) {
      console.error('❌ Phase 9 Instagram scraper error:', error);
      return {
        success: false,
        postsScraped: 0,
        topPerformers: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get insights (views, likes, comments) for a specific post
   */
  private async getPostInsights(mediaId: string): Promise<{ views: number; likes: number; comments: number }> {
    try {
      // Get insights - different metrics for different media types
      const insightsUrl = `https://graph.facebook.com/v18.0/${mediaId}/insights`;
      const metrics = 'plays,likes,comments'; // 'plays' is for video views
      
      const response = await axios.get(`${insightsUrl}?metric=${metrics}&access_token=${this.accessToken}`);
      const insightsData: InstagramInsightsResponse = response.data;

      let views = 0;
      let likes = 0;
      let comments = 0;

      insightsData.data.forEach(insight => {
        const value = insight.values[0]?.value || 0;
        switch (insight.name) {
          case 'plays':
          case 'video_views':
            views = value;
            break;
          case 'likes':
            likes = value;
            break;
          case 'comments':
            comments = value;
            break;
        }
      });

      return { views, likes, comments };

    } catch (error) {
      console.warn(`⚠️ Could not fetch insights for ${mediaId}, using defaults`);
      return { views: 0, likes: 0, comments: 0 };
    }
  }

  /**
   * Process individual post and save to database
   */
  private async processPost(post: any, insights: { views: number; likes: number; comments: number }): Promise<IInstagramContent | null> {
    try {
      // Extract hashtags from caption
      const hashtags = this.extractHashtags(post.caption || '');
      
      // Calculate performance score: views + likes * 1.5 + comments * 2
      const performanceScore = insights.views + (insights.likes * 1.5) + (insights.comments * 2);

      // Create or update post in database
      const existingPost = await InstagramContent.findOne({ igMediaId: post.id });
      
      const postData = {
        igMediaId: post.id,
        caption: post.caption || '',
        media_url: post.media_url,
        timestamp: new Date(post.timestamp),
        viewCount: insights.views,
        likeCount: insights.likes,
        commentCount: insights.comments,
        hashtags,
        performanceScore,
        scrapedAt: new Date(),
        mediaType: post.media_type,
        permalink: post.permalink,
        isEligibleForRepost: performanceScore > 100, // Basic threshold
        repostPriority: 0 // Will be set in identifyTopPerformers
      };

      if (existingPost) {
        // Update existing post
        Object.assign(existingPost, postData);
        await existingPost.save();
        return existingPost;
      } else {
        // Create new post
        const newPost = new InstagramContent(postData);
        await newPost.save();
        return newPost;
      }

    } catch (error) {
      console.error(`❌ Error processing post ${post.id}:`, error);
      return null;
    }
  }

  /**
   * Extract hashtags from caption text
   */
  private extractHashtags(caption: string): string[] {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = caption.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
  }

  /**
   * Identify top 50 performers and mark them for reposting
   */
  private async identifyTopPerformers(): Promise<number> {
    try {
      // Get top 50 posts by performance score
      const topPosts = await InstagramContent.find({
        mediaType: 'VIDEO', // Only video content for reposting
        performanceScore: { $gt: 0 }
      })
      .sort({ performanceScore: -1 })
      .limit(50);

      console.log(`🏆 Identified ${topPosts.length} top performers`);

      // Update repost priority and eligibility
      for (let i = 0; i < topPosts.length; i++) {
        const post = topPosts[i];
        post.isEligibleForRepost = true;
        post.repostPriority = i + 1; // 1 = highest priority
        await post.save();

        // Add to repost queue for both platforms (if settings allow)
        await this.queueForRepost(post, i + 1);
      }

      return topPosts.length;

    } catch (error) {
      console.error('❌ Error identifying top performers:', error);
      return 0;
    }
  }

  /**
   * Add top performing content to repost queue
   */
  private async queueForRepost(post: IInstagramContent, priority: number): Promise<void> {
    try {
      // Read settings to check what platforms are enabled
      const settingsPath = path.join(__dirname, '../../../settings.json');
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      
      const phase9Settings = settings.phase9Settings || {};
      const enableYouTube = phase9Settings.enableYouTubeReposts !== false;
      const enableInstagram = phase9Settings.enableInstagramReposts !== false;
      const repostDelay = phase9Settings.repostDelay || 7; // days

      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + repostDelay);

      const originalContent = {
        caption: post.caption,
        hashtags: post.hashtags,
        performanceScore: post.performanceScore,
        viewCount: post.viewCount,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        media_url: post.media_url,
        permalink: post.permalink
      };

      // Queue for YouTube if enabled
      if (enableYouTube) {
        try {
          await RepostQueue.create({
            sourceMediaId: post.igMediaId,
            targetPlatform: 'youtube',
            priority,
            scheduledFor: scheduledDate,
            originalContent
          });
          console.log(`📺 Queued ${post.igMediaId} for YouTube repost (priority ${priority})`);
        } catch (error) {
          // Might already exist, that's okay
        }
      }

      // Queue for Instagram if enabled (different schedule to avoid duplication)
      if (enableInstagram) {
        const instagramDate = new Date(scheduledDate);
        instagramDate.setDate(instagramDate.getDate() + 1); // Offset by 1 day

        try {
          await RepostQueue.create({
            sourceMediaId: post.igMediaId,
            targetPlatform: 'instagram',
            priority,
            scheduledFor: instagramDate,
            originalContent
          });
          console.log(`📱 Queued ${post.igMediaId} for Instagram repost (priority ${priority})`);
        } catch (error) {
          // Might already exist, that's okay
        }
      }

    } catch (error) {
      console.error(`❌ Error queueing post ${post.igMediaId} for repost:`, error);
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current scraping statistics
   */
  async getScrapingStats(): Promise<{
    totalPosts: number;
    recentPosts: number;
    topPerformers: number;
    avgPerformanceScore: number;
    lastScrapedAt?: Date;
  }> {
    try {
      const totalPosts = await InstagramContent.countDocuments();
      
      const recentCutoff = new Date();
      recentCutoff.setHours(recentCutoff.getHours() - 24);
      const recentPosts = await InstagramContent.countDocuments({
        scrapedAt: { $gte: recentCutoff }
      });

      const topPerformers = await InstagramContent.countDocuments({
        isEligibleForRepost: true
      });

      const avgResult = await InstagramContent.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$performanceScore' } } }
      ]);
      const avgPerformanceScore = avgResult[0]?.avgScore || 0;

      const lastPost = await InstagramContent.findOne().sort({ scrapedAt: -1 });
      const lastScrapedAt = lastPost?.scrapedAt;

      return {
        totalPosts,
        recentPosts,
        topPerformers,
        avgPerformanceScore: Math.round(avgPerformanceScore),
        lastScrapedAt
      };

    } catch (error) {
      console.error('❌ Error getting scraping stats:', error);
      return {
        totalPosts: 0,
        recentPosts: 0,
        topPerformers: 0,
        avgPerformanceScore: 0
      };
    }
  }
} 