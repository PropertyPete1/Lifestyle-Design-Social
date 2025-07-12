const cron = require('node-cron');
const Post = require('../models/Post');
const Video = require('../models/Video');
const User = require('../models/User');
const twitterService = require('./twitterService');
const instagramService = require('./instagramService');
const aiService = require('./aiService');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;
    
    console.log('🕐 Starting scheduler service...');
    this.isRunning = true;

    // Load existing scheduled posts
    await this.loadScheduledPosts();

    // Start cron job to check for new posts every minute
    cron.schedule('* * * * *', async () => {
      await this.processScheduledPosts();
    });

    // Start cron job to update engagement metrics every hour
    cron.schedule('0 * * * *', async () => {
      await this.updateEngagementMetrics();
    });

    // Start auto-posting schedule (3 times daily at optimal times)
    this.startAutoPostingSchedule();

    console.log('✅ Scheduler service started');
  }

  async stop() {
    console.log('🛑 Stopping scheduler service...');
    this.isRunning = false;
    
    // Clear all scheduled jobs
    this.jobs.forEach(job => job.stop());
    this.jobs.clear();
    
    console.log('✅ Scheduler service stopped');
  }

  async loadScheduledPosts() {
    try {
      const scheduledPosts = await Post.find({
        status: 'scheduled',
        scheduledTime: { $gt: new Date() }
      }).populate('user video');

      console.log(`📋 Loaded ${scheduledPosts.length} scheduled posts`);

      scheduledPosts.forEach(post => {
        this.schedulePost(post);
      });
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
    }
  }

  async schedulePost(post) {
    try {
      const jobId = post._id.toString();
      
      // Cancel existing job if any
      if (this.jobs.has(jobId)) {
        this.jobs.get(jobId).stop();
      }

      // Calculate delay until scheduled time
      const delay = post.scheduledTime.getTime() - Date.now();
      
      if (delay <= 0) {
        // Post is overdue, process immediately
        await this.processPost(post);
        return;
      }

      // Schedule the job
      const job = setTimeout(async () => {
        await this.processPost(post);
        this.jobs.delete(jobId);
      }, delay);

      this.jobs.set(jobId, { stop: () => clearTimeout(job) });
      
      console.log(`📅 Scheduled post ${jobId} for ${post.scheduledTime}`);
    } catch (error) {
      console.error('Error scheduling post:', error);
    }
  }

  async processScheduledPosts() {
    try {
      const overduePosts = await Post.find({
        status: 'scheduled',
        scheduledTime: { $lte: new Date() }
      }).populate('user video');

      for (const post of overduePosts) {
        await this.processPost(post);
      }
    } catch (error) {
      console.error('Error processing scheduled posts:', error);
    }
  }

  async processPost(post) {
    try {
      console.log(`🚀 Processing post ${post._id} for ${post.platform}`);

      // Update post status to processing
      post.status = 'processing';
      await post.save();

      let result = {};

      // Post to appropriate platform(s)
      if (post.platform === 'twitter' || post.platform === 'both') {
        try {
          const twitterResult = await this.postToTwitter(post);
          result.twitter = twitterResult;
        } catch (error) {
          console.error('Twitter posting failed:', error);
          result.twitter = { success: false, error: error.message };
        }
      }

      if (post.platform === 'instagram' || post.platform === 'both') {
        try {
          const instagramResult = await this.postToInstagram(post);
          result.instagram = instagramResult;
        } catch (error) {
          console.error('Instagram posting failed:', error);
          result.instagram = { success: false, error: error.message };
        }
      }

      // Update post with results
      await this.updatePostResults(post, result);

    } catch (error) {
      console.error('Error processing post:', error);
      await this.handlePostError(post, error);
    }
  }

  async postToTwitter(post) {
    const videoPath = post.video.filePath;
    const caption = this.buildCaption(post, 'twitter');
    
    return await twitterService.postVideo(videoPath, caption);
  }

  async postToInstagram(post) {
    const videoPath = post.video.filePath;
    const caption = post.content.caption;
    const hashtags = post.content.hashtags || [];
    const location = post.video.location || 'sanAntonio';
    
    console.log(`📱 Posting to Instagram ${location} account with ${hashtags.length} viral hashtags`);
    console.log(`📝 Caption source: ${post.content.source || 'unknown'}`);
    
    return await instagramService.postVideo(videoPath, caption, hashtags, location, post.userId);
  }

  buildCaption(post, platform) {
    let caption = post.content.caption;
    
    // Add hashtags for Twitter
    if (platform === 'twitter' && post.content.hashtags && post.content.hashtags.length > 0) {
      caption += '\n\n' + post.content.hashtags.join(' ');
    }
    
    return caption;
  }

  async updatePostResults(post, results) {
    try {
      const hasSuccess = Object.values(results).some(result => result.success);
      
      if (hasSuccess) {
        post.status = 'published';
        post.publishedTime = new Date();
        
        // Store social media IDs
        if (results.twitter && results.twitter.success) {
          post.socialMediaIds.twitter = results.twitter.tweetId;
        }
        if (results.instagram && results.instagram.success) {
          post.socialMediaIds.instagram = results.instagram.mediaId;
        }
        
        // Handle Instagram not configured case
        if (results.instagram && !results.instagram.success && results.instagram.reason === 'instagram_not_configured') {
          console.log('📝 Instagram posting disabled - post data saved for manual posting');
          post.instagramData = {
            caption: results.instagram.caption,
            hashtags: results.instagram.hashtags,
            fullCaption: results.instagram.fullCaption,
            videoPath: results.instagram.videoPath
          };
        }
      } else {
        post.status = 'failed';
        post.error = {
          message: 'All platforms failed',
          code: 'ALL_FAILED',
          platform: post.platform
        };
      }

      await post.save();
      console.log(`✅ Post ${post._id} ${post.status}`);
    } catch (error) {
      console.error('Error updating post results:', error);
    }
  }

  async handlePostError(post, error) {
    try {
      post.status = 'failed';
      post.error = {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        platform: post.platform
      };
      post.retryCount += 1;

      // Retry logic
      if (post.retryCount < post.maxRetries) {
        // Schedule retry in 5 minutes
        setTimeout(async () => {
          post.status = 'scheduled';
          post.scheduledTime = new Date(Date.now() + 5 * 60 * 1000);
          await post.save();
          await this.schedulePost(post);
        }, 5 * 60 * 1000);
      }

      await post.save();
    } catch (saveError) {
      console.error('Error handling post error:', saveError);
    }
  }

  async updateEngagementMetrics() {
    try {
      const publishedPosts = await Post.find({
        status: 'published',
        publishedTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      for (const post of publishedPosts) {
        await this.updatePostEngagement(post);
      }
    } catch (error) {
      console.error('Error updating engagement metrics:', error);
    }
  }

  async updatePostEngagement(post) {
    try {
      if (post.socialMediaIds.twitter) {
        const twitterEngagement = await twitterService.getEngagement(post.socialMediaIds.twitter);
        post.engagement.likes += twitterEngagement.likes;
        post.engagement.shares += twitterEngagement.retweets;
        post.engagement.views += twitterEngagement.views;
      }

      if (post.socialMediaIds.instagram) {
        const instagramEngagement = await instagramService.getEngagement(post.socialMediaIds.instagram);
        post.engagement.likes += instagramEngagement.likes;
        post.engagement.comments += instagramEngagement.comments;
        post.engagement.views += instagramEngagement.views;
      }

      await post.save();
    } catch (error) {
      console.error('Error updating post engagement:', error);
    }
  }

  async getOptimalTimes(userId, platform = 'both') {
    try {
      const user = await User.findById(userId);
      const timezone = user.settings.timezone || 'America/New_York';
      
      return await aiService.suggestOptimalTimes(timezone);
    } catch (error) {
      console.error('Error getting optimal times:', error);
      // Return default times
      return platform === 'twitter' 
        ? ['09:00', '12:00', '15:00', '18:00', '20:00']
        : ['08:00', '11:00', '14:00', '17:00', '19:00', '21:00'];
    }
  }

  async cancelPost(postId) {
    try {
      const post = await Post.findById(postId);
      if (!post) throw new Error('Post not found');

      // Cancel scheduled job
      const jobId = post._id.toString();
      if (this.jobs.has(jobId)) {
        this.jobs.get(jobId).stop();
        this.jobs.delete(jobId);
      }

      // Update post status
      post.status = 'cancelled';
      await post.save();

      console.log(`❌ Cancelled post ${postId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling post:', error);
      throw error;
    }
  }

  getScheduledJobs() {
    return Array.from(this.jobs.keys());
  }

  async startAutoPostingSchedule() {
    console.log('🤖 Starting auto-posting schedule (3 times daily)...');
    
    // Optimal posting times for buyer engagement (EST)
    const optimalTimes = [
      '09:00', // Morning - buyers checking before work
      '12:00', // Lunch break - peak social media time
      '18:00'  // Evening - buyers relaxing and browsing
    ];
    
    // Schedule auto-posting for each optimal time
    optimalTimes.forEach(time => {
      const [hour, minute] = time.split(':');
      
      // Schedule for every day at these times
      cron.schedule(`${minute} ${hour} * * *`, async () => {
        console.log(`🚀 Auto-posting at ${time} EST...`);
        await this.autoPostFromCameraRoll();
      });
      
      console.log(`📅 Scheduled auto-post at ${time} EST daily`);
    });
  }

  async autoPostFromCameraRoll() {
    try {
      const cameraRollService = require('./cameraRollService');
      const cartoonService = require('./cartoonService');
      
      // Get all users with auto-posting enabled
      const users = await User.find({ autoPostingEnabled: true });
      
      for (const user of users) {
        try {
          console.log(`📱 Auto-posting for user: ${user.email}`);
          
          // Get user's post count to determine if we should create a cartoon
          const userPostCount = await Post.countDocuments({ user: user._id });
          const shouldCreateCartoon = cartoonService.shouldCreateCartoon(userPostCount);
          
          if (shouldCreateCartoon) {
            console.log(`🎨 Creating cartoon for user: ${user.email} (post #${userPostCount + 1})`);
            
            // Create cartoon instead of using camera roll video
            const cartoon = await cartoonService.createCompleteCartoon();
            
            // Create post for both platforms with cartoon
            const post = new Post({
              user: user._id,
              video: null, // No video record for cartoons
              platform: 'both',
              content: {
                caption: cartoon.caption,
                hashtags: cartoon.hashtags,
                cartoonPath: cartoon.video.path,
                cartoonTitle: cartoon.script.title
              },
              status: 'scheduled',
              scheduledTime: new Date(), // Post immediately
              autoGenerated: true,
              contentType: 'cartoon'
            });
            
            await post.save();
            
            // Process the cartoon post immediately
            await this.processCartoonPost(post, cartoon);
            
            console.log(`✅ Auto-posted cartoon for user: ${user.email}`);
            
          } else {
            console.log(`📹 Using camera roll video for user: ${user.email} (post #${userPostCount + 1})`);
            
            // Select and prepare videos from camera roll
            const videos = await cameraRollService.autoSelectAndPrepareVideos(user._id, 1);
            
            if (videos.length === 0) {
              console.log(`⚠️ No suitable videos found for user: ${user.email}`);
              continue;
            }
            
            const video = videos[0]; // Use the best video
            const location = video.location || 'sanAntonio';
            
            console.log(`📍 Detected location: ${location} for video: ${video.title}`);
            
            // Generate AI content for buyer audience with location context
            const aiContent = await this.generateBuyerFocusedContent(video, location);
            
            // Create post for both platforms
            const post = new Post({
              user: user._id,
              video: video._id,
              platform: 'both',
              content: {
                caption: aiContent.caption,
                hashtags: aiContent.hashtags,
                location: location
              },
              status: 'scheduled',
              scheduledTime: new Date(), // Post immediately
              autoGenerated: true,
              contentType: 'video'
            });
            
            await post.save();
            
            // Process the post immediately
            await this.processPost(post);
            
            console.log(`✅ Auto-posted ${location} video for user: ${user.email}`);
          }
          
        } catch (error) {
          console.error(`❌ Auto-posting failed for user ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in auto-posting:', error);
    }
  }

  async generateBuyerFocusedContent(video, location = 'sanAntonio') {
    try {
      const videoMatchingService = require('./videoMatchingService');
      
      // Create video data for AI analysis
      const videoData = {
        title: video.title,
        description: video.description,
        category: video.category,
        propertyType: video.propertyType,
        location: location,
        price: video.price,
        tags: video.tags
      };
      
      console.log(`📝 Generating content for video: ${video.title} (${location})`);
      
      // Use the video matching service to get optimized content
      const optimizedContent = await videoMatchingService.getOptimizedContentForVideo(
        video.filePath, 
        videoData
      );
      
      console.log(`📱 Content source: ${optimizedContent.source}`);
      if (optimizedContent.source === 'existing_instagram') {
        console.log(`📋 Using existing Instagram caption: "${optimizedContent.caption.substring(0, 100)}..."`);
      }
      
      return {
        caption: optimizedContent.caption,
        hashtags: optimizedContent.hashtags,
        source: optimizedContent.source,
        postId: optimizedContent.postId,
        location: location
      };
    } catch (error) {
      console.error('Error generating buyer-focused content:', error);
      
      const locationName = location === 'austin' ? 'Austin' : 'San Antonio';
      
      // Fallback content with location
      return {
        caption: `🏠 Dream home alert in ${locationName}! This could be your next investment. Perfect timing for buyers in today's market. DM for details!`,
        hashtags: ['#RealEstate', '#HomeBuying', '#Investment', '#DreamHome', '#BuyNow'],
        source: 'fallback',
        postId: null,
        location: location
      };
    }
  }

  async processCartoonPost(post, cartoon) {
    try {
      console.log(`🎨 Processing cartoon post: ${cartoon.script.title}`);

      // Update post status to processing
      post.status = 'processing';
      await post.save();

      let result = {};

      // Post to appropriate platform(s)
      if (post.platform === 'twitter' || post.platform === 'both') {
        try {
          const twitterResult = await this.postCartoonToTwitter(post, cartoon);
          result.twitter = twitterResult;
        } catch (error) {
          console.error('Twitter cartoon posting failed:', error);
          result.twitter = { success: false, error: error.message };
        }
      }

      if (post.platform === 'instagram' || post.platform === 'both') {
        try {
          const instagramResult = await this.postCartoonToInstagram(post, cartoon);
          result.instagram = instagramResult;
        } catch (error) {
          console.error('Instagram cartoon posting failed:', error);
          result.instagram = { success: false, error: error.message };
        }
      }

      // Update post with results
      await this.updatePostResults(post, result);

    } catch (error) {
      console.error('Error processing cartoon post:', error);
      await this.handlePostError(post, error);
    }
  }

  async postCartoonToTwitter(post, cartoon) {
    const videoPath = cartoon.video.path;
    const caption = post.content.caption;
    const hashtags = post.content.hashtags || [];
    
    console.log(`🐦 Posting cartoon to Twitter: ${cartoon.script.title}`);
    
    const twitterService = require('./twitterService');
    return await twitterService.postVideo(videoPath, `${caption}\n\n${hashtags.join(' ')}`);
  }

  async postCartoonToInstagram(post, cartoon) {
    const videoPath = cartoon.video.path;
    const caption = post.content.caption;
    const hashtags = post.content.hashtags || [];
    const location = post.content.location || 'sanAntonio';
    
    console.log(`📱 Posting cartoon to Instagram ${location} account: ${cartoon.script.title}`);
    
    const instagramService = require('./instagramService');
    return await instagramService.postVideo(videoPath, caption, hashtags, location, post.userId);
  }
}

module.exports = new SchedulerService(); 