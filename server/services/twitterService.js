const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

class TwitterService {
  constructor() {
    // Check if Twitter credentials are available
    const hasCredentials = process.env.TWITTER_API_KEY && 
                          process.env.TWITTER_API_SECRET && 
                          process.env.TWITTER_ACCESS_TOKEN && 
                          process.env.TWITTER_ACCESS_SECRET;

    if (hasCredentials) {
      try {
        this.client = new TwitterApi({
          appKey: process.env.TWITTER_API_KEY,
          appSecret: process.env.TWITTER_API_SECRET,
          accessToken: process.env.TWITTER_ACCESS_TOKEN,
          accessSecret: process.env.TWITTER_ACCESS_SECRET,
        });
        this.isConfigured = true;
        console.log('✅ Twitter service initialized');
      } catch (error) {
        console.warn('⚠️ Twitter service initialization failed:', error.message);
        this.client = null;
        this.isConfigured = false;
      }
    } else {
      console.log('ℹ️ Twitter credentials not configured - service disabled');
      this.client = null;
      this.isConfigured = false;
    }
  }

  _checkConfiguration() {
    if (!this.isConfigured || !this.client) {
      throw new Error('Twitter service not configured. Please add Twitter API credentials.');
    }
  }

  async postVideo(videoPath, caption) {
    try {
      this._checkConfiguration();
      console.log('📱 Posting video to Twitter...');
      
      // Upload video
      const mediaId = await this.uploadVideo(videoPath);
      
      // Post tweet with video
      const tweet = await this.client.v2.tweet({
        text: caption,
        media: {
          media_ids: [mediaId]
        }
      });

      console.log('✅ Video posted to Twitter successfully');
      return {
        success: true,
        tweetId: tweet.data.id,
        url: `https://twitter.com/user/status/${tweet.data.id}`
      };
    } catch (error) {
      console.error('❌ Error posting to Twitter:', error);
      throw new Error(`Twitter posting failed: ${error.message}`);
    }
  }

  async uploadVideo(videoPath) {
    try {
      this._checkConfiguration();
      
      // Check if file exists
      if (!fs.existsSync(videoPath)) {
        throw new Error('Video file not found');
      }

      // Get file stats
      const stats = fs.statSync(videoPath);
      const fileSize = stats.size;

      // Check file size (Twitter limit: 512MB)
      if (fileSize > 512 * 1024 * 1024) {
        throw new Error('Video file too large for Twitter (max 512MB)');
      }

      // Read file as buffer
      const videoBuffer = fs.readFileSync(videoPath);

      // Upload media
      const mediaId = await this.client.v1.uploadMedia(videoBuffer, {
        mimeType: this.getMimeType(videoPath)
      });

      return mediaId;
    } catch (error) {
      console.error('Error uploading video to Twitter:', error);
      throw error;
    }
  }

  async postText(caption) {
    try {
      this._checkConfiguration();
      console.log('📱 Posting text to Twitter...');
      
      const tweet = await this.client.v2.tweet(caption);
      
      console.log('✅ Text posted to Twitter successfully');
      return {
        success: true,
        tweetId: tweet.data.id,
        url: `https://twitter.com/user/status/${tweet.data.id}`
      };
    } catch (error) {
      console.error('❌ Error posting text to Twitter:', error);
      throw new Error(`Twitter posting failed: ${error.message}`);
    }
  }

  async getAccountInfo() {
    try {
      this._checkConfiguration();
      const me = await this.client.v2.me({
        'user.fields': ['username', 'name', 'profile_image_url', 'public_metrics']
      });
      return me.data;
    } catch (error) {
      console.error('Error getting Twitter account info:', error);
      throw error;
    }
  }

  async getEngagement(tweetId) {
    try {
      this._checkConfiguration();
      const tweet = await this.client.v2.singleTweet(tweetId, {
        'tweet.fields': ['public_metrics', 'created_at']
      });
      
      return {
        likes: tweet.data.public_metrics.like_count,
        retweets: tweet.data.public_metrics.retweet_count,
        replies: tweet.data.public_metrics.reply_count,
        quotes: tweet.data.public_metrics.quote_count,
        views: tweet.data.public_metrics.impression_count || 0
      };
    } catch (error) {
      console.error('Error getting Twitter engagement:', error);
      return {
        likes: 0,
        retweets: 0,
        replies: 0,
        quotes: 0,
        views: 0
      };
    }
  }

  async validateCredentials() {
    try {
      if (!this.isConfigured) {
        return false;
      }
      await this.getAccountInfo();
      return true;
    } catch (error) {
      console.error('Twitter credentials validation failed:', error);
      return false;
    }
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm'
    };
    return mimeTypes[ext] || 'video/mp4';
  }

  async optimizeVideoForTwitter(videoPath) {
    // This would integrate with FFmpeg to optimize video for Twitter
    // For now, return the original path
    return videoPath;
  }

  async schedulePost(videoPath, caption, scheduledTime) {
    // Twitter doesn't have native scheduling in their API
    // This would need to be handled by the main scheduler
    throw new Error('Twitter scheduling not supported via API - use main scheduler');
  }
}

module.exports = new TwitterService(); 