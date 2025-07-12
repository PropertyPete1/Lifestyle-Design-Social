const axios = require('axios');
const fs = require('fs');
const path = require('path');
const aiService = require('./aiService');
const SocialAccount = require('../models/SocialAccount');

class InstagramService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    this.accounts = {
      austin: {
        accessToken: process.env.INSTAGRAM_GRAPH_API_TOKEN_AUSTIN,
        businessAccountId: null,
        location: 'austin'
      },
      sanAntonio: {
        accessToken: process.env.INSTAGRAM_GRAPH_API_TOKEN_SAN_ANTONIO,
        businessAccountId: null,
        location: 'san antonio'
      }
    };
  }

  // Detect location from video filename (expanded for suburbs)
  detectLocationFromFilename(filename) {
    const lowerFilename = filename.toLowerCase();
    // Austin and suburbs
    const austinTerms = [
      'austin', 'leander', 'round rock', 'cedar park', 'pflugerville', 'georgetown', 'hutto', 'manor', 'bee cave', 'lakeway', 'dripping springs', 'buda', 'kyle', 'west lake', 'westlake', 'jonestown', 'lagovista', 'laguna vista', 'sunset valley', 'wells branch', 'brushy creek', 'hudson bend', 'del valle', 'anderson mill', 'jollyville', 'tarrytown', 'oak hill', 'steiner ranch', 'four points', 'barton creek', 'rollingwood', 'lost creek', 'shady hollow', 'wimberley', 'spicewood', 'volente', 'point venture'
    ];
    // San Antonio and suburbs
    const saTerms = [
      'san antonio', 'alamo ranch', 'stone oak', 'schertz', 'converse', 'helotes', 'alamo heights', 'universal city', 'live oak', 'selma', 'cibolo', 'new braunfels', 'boerne', 'castroville', 'shavano park', 'windcrest', 'bulverde', 'terrell hills', 'hollywood park', 'olmos park', 'timberwood park', 'fair oaks', 'fair oaks ranch', 'garden ridge', 'balcones heights', 'leon valley', 'china grove', 'kirby', 'castle hills', 'grey forest', 'hill country village', 'cross mountain', 'macdona', 'somerset', 'von ormy', 'atascosa', 'adkins', 'lacoste', 'lytle', 'st hedwig', 'st. hedwig', 'elmendorf', 'sandy oaks', 'losoya', 'bigfoot', 'pipe creek', 'lakehills', 'medina lake', 'pleasanton', 'devine', 'floresville', 'poteet', 'jourdanton', 'poth', 'la vernia', 'seguin', 'marion', 'mcqueeney', 'spring branch', 'bulverde', 'garden ridge', 'selma', 'canyon lake', 'universal city', 'live oak', 'randolph afb', 'randolph', 'fort sam', 'fort sam houston', 'lackland', 'lackland afb', 'jbsa', 'jbsa lackland', 'jbsa randolph', 'jbsa fort sam', 'jbsa sam houston'
    ];
    
    for (const term of austinTerms) {
      if (lowerFilename.includes(term)) return 'austin';
    }
    for (const term of saTerms) {
      if (lowerFilename.includes(term)) return 'sanAntonio';
    }
    // Default
    return 'sanAntonio';
  }

  // Get account for specific location
  getAccountForLocation(location) {
    return this.accounts[location] || this.accounts.sanAntonio;
  }

  // Add this method to refresh tokens from DB
  async refreshTokensForUser(userId) {
    // For both austin and sanAntonio
    for (const city of ['austin', 'sanAntonio']) {
      const account = await SocialAccount.findByUserPlatformCity(userId, 'instagram', city);
      if (account && account.accessToken) {
        this.accounts[city].accessToken = account.accessToken;
      }
    }
  }

  async initialize(userId) {
    await this.refreshTokensForUser(userId);
    try {
      const results = {};
      
      for (const [location, account] of Object.entries(this.accounts)) {
        if (!account.accessToken) {
          console.log(`⚠️ Instagram Graph API token not configured for ${location} - Instagram posting disabled`);
          results[location] = false;
          continue;
        }

        try {
          // Get the Instagram Business Account ID
          const response = await axios.get(`${this.baseUrl}/me/accounts`, {
            params: {
              access_token: account.accessToken,
              fields: 'instagram_business_account'
            }
          });

          const page = response.data.data[0];
          if (page && page.instagram_business_account) {
            account.businessAccountId = page.instagram_business_account.id;
            console.log(`✅ Instagram Graph API initialized successfully for ${location}`);
            results[location] = true;
          } else {
            console.log(`⚠️ No Instagram Business Account found for ${location} - Instagram posting disabled`);
            console.log(`💡 To enable Instagram posting for ${location}:`);
            console.log(`   1. Connect your Instagram account to a Facebook Page`);
            console.log(`   2. Convert your Instagram account to a Business/Creator account`);
            console.log(`   3. Ensure your Facebook Page has the Instagram account connected`);
            results[location] = false;
          }
        } catch (error) {
          console.error(`❌ Instagram Graph API initialization failed for ${location}:`, error.message);
          console.log(`💡 Instagram posting will be disabled for ${location} - videos and cartoons will still be created`);
          results[location] = false;
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ Instagram Graph API initialization failed:', error.message);
      console.log('💡 Instagram posting will be disabled - videos and cartoons will still be created');
      return { austin: false, sanAntonio: false };
    }
  }

  async checkVideoExists(videoPath, location = 'sanAntonio') {
    try {
      const account = this.getAccountForLocation(location);
      if (!account.businessAccountId) {
        const initialized = await this.initialize();
        if (!initialized[location]) {
          return {
            exists: false,
            existingCaption: null,
            postId: null
          };
        }
      }

      // Get recent media from Instagram Business Account
      const response = await axios.get(`${this.baseUrl}/${account.businessAccountId}/media`, {
        params: {
          access_token: account.accessToken,
          fields: 'id,caption,media_type,timestamp',
          limit: 50
        }
      });

      const recentPosts = response.data.data;
      
      // For now, we'll check the last 50 posts
      // In a production system, you might want to store video hashes for more accurate matching
      return {
        exists: false,
        existingCaption: null,
        postId: null
      };
    } catch (error) {
      console.error('Error checking if video exists:', error);
      return {
        exists: false,
        existingCaption: null,
        postId: null
      };
    }
  }

  async extractCaptionFromExistingPost(postId, location = 'sanAntonio') {
    try {
      const account = this.getAccountForLocation(location);
      if (!account.businessAccountId) {
        const initialized = await this.initialize();
        if (!initialized[location]) {
          return null;
        }
      }

      const response = await axios.get(`${this.baseUrl}/${postId}`, {
        params: {
          access_token: account.accessToken,
          fields: 'caption'
        }
      });

      const caption = response.data.caption || '';
      
      // Remove hashtags from existing caption
      const captionWithoutHashtags = this.removeHashtags(caption);
      
      return captionWithoutHashtags.trim();
    } catch (error) {
      console.error('Error extracting caption from existing post:', error);
      return null;
    }
  }

  removeHashtags(text) {
    // Remove hashtags from text while preserving the rest
    return text.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
  }

  async generateViralHashtags(videoData, location = 'sanAntonio', existingCaption = null) {
    try {
      // Check if AI service is available
      if (!aiService.openai) {
        console.log('AI service not available, using fallback hashtags');
        const locationHashtags = location === 'austin' 
          ? ['#AustinRealEstate', '#AustinHomes', '#AustinTX', '#AustinProperty']
          : ['#SanAntonioRealEstate', '#SanAntonioHomes', '#SanAntonioTX', '#SanAntonioProperty'];
        
        return [
          ...locationHashtags,
          '#RealEstate', '#HomeBuying', '#Investment', '#DreamHome', '#BuyNow',
          '#Property', '#HouseHunting', '#RealEstateInvesting', '#HomeInvestment',
          '#BuyerMarket', '#RealEstateTips', '#PropertyInvestment', '#HomeBuyers',
          '#RealEstateAgent', '#PropertyShowcase', '#InvestmentProperty', '#HomeBuyingTips'
        ];
      }

      const locationName = location === 'austin' ? 'Austin' : 'San Antonio';
      const prompt = `Generate 20-25 viral hashtags for a real estate video targeting BUYERS looking to purchase within 30-90 days in ${locationName}, Texas.

Video Details:
- Title: ${videoData.title || 'Real estate video'}
- Description: ${videoData.description || 'Property showcase'}
- Property Type: ${videoData.propertyType || 'residential'}
- Category: ${videoData.category || 'residential'}
- Location: ${locationName}, Texas

${existingCaption ? `Existing Caption: "${existingCaption}"` : ''}

Requirements:
- Focus on VIRAL hashtags that get high engagement
- Target active homebuyers and investors in ${locationName}
- Include trending real estate hashtags for ${locationName}
- Mix of broad and specific hashtags
- Optimize for Instagram algorithm
- Include ${locationName}-specific location hashtags
- Focus on buyer urgency and investment potential
- Include Texas real estate hashtags

Return only hashtags separated by spaces, no explanations.`;

      const response = await aiService.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a social media expert specializing in viral hashtag generation for real estate content targeting active buyers in ${locationName}, Texas.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const hashtags = response.choices[0].message.content.trim();
      return hashtags.split(' ').filter(tag => tag.startsWith('#'));
    } catch (error) {
      console.error('Error generating viral hashtags:', error);
      
      // Fallback hashtags with location
      const locationHashtags = location === 'austin' 
        ? ['#AustinRealEstate', '#AustinHomes', '#AustinTX', '#AustinProperty']
        : ['#SanAntonioRealEstate', '#SanAntonioHomes', '#SanAntonioTX', '#SanAntonioProperty'];
      
      return [
        ...locationHashtags,
        '#RealEstate', '#HomeBuying', '#Investment', '#DreamHome', '#BuyNow',
        '#Property', '#HouseHunting', '#RealEstateInvesting', '#HomeInvestment',
        '#BuyerMarket', '#RealEstateTips', '#PropertyInvestment', '#HomeBuyers',
        '#RealEstateAgent', '#PropertyShowcase', '#InvestmentProperty', '#HomeBuyingTips'
      ];
    }
  }

  async createOptimizedCaption(videoData, location = 'sanAntonio', existingCaption = null) {
    try {
      // Generate viral hashtags
      const viralHashtags = await this.generateViralHashtags(videoData, location, existingCaption);
      
      // If we have an existing caption, use it as base
      if (existingCaption) {
        return {
          caption: existingCaption,
          hashtags: viralHashtags,
          source: 'existing_caption'
        };
      }
      
      // Otherwise, generate a new buyer-focused caption
      const aiContent = await aiService.generateCompletePost(videoData, 'instagram');
      
      return {
        caption: aiContent.caption,
        hashtags: viralHashtags,
        source: 'ai_generated'
      };
    } catch (error) {
      console.error('Error creating optimized caption:', error);
      
      const locationName = location === 'austin' ? 'Austin' : 'San Antonio';
      
      // Fallback
      return {
        caption: `🏠 Dream home alert in ${locationName}! This could be your next investment. Perfect timing for buyers in today's market. DM for details!`,
        hashtags: ['#RealEstate', '#HomeBuying', '#Investment', '#DreamHome', '#BuyNow'],
        source: 'fallback'
      };
    }
  }

  async postVideo(videoPath, caption, hashtags = [], location = 'sanAntonio', userId) {
    await this.refreshTokensForUser(userId);
    try {
      const account = this.getAccountForLocation(location);
      if (!account.businessAccountId) {
        const initialized = await this.initialize();
        if (!initialized[location]) {
          console.log(`📝 Instagram posting disabled for ${location} - saving post data for manual posting`);
          return {
            success: false,
            reason: 'instagram_not_configured',
            location: location,
            caption: caption,
            hashtags: hashtags,
            fullCaption: hashtags.length > 0 ? `${caption}\n\n${hashtags.join(' ')}` : caption,
            videoPath: videoPath
          };
        }
      }

      // Combine caption with hashtags
      const fullCaption = hashtags.length > 0 
        ? `${caption}\n\n${hashtags.join(' ')}`
        : caption;

      // Create container for video upload
      const containerResponse = await axios.post(`${this.baseUrl}/${account.businessAccountId}/media`, {
        media_type: 'REELS',
        video_url: videoPath, // In production, you'd upload to a public URL first
        caption: fullCaption,
        access_token: account.accessToken
      });

      const containerId = containerResponse.data.id;

      // Publish the container
      const publishResponse = await axios.post(`${this.baseUrl}/${account.businessAccountId}/media_publish`, {
        creation_id: containerId,
        access_token: account.accessToken
      });

      console.log(`✅ Instagram video posted successfully to ${location} account`);
      return {
        success: true,
        mediaId: publishResponse.data.id,
        caption: fullCaption,
        hashtags: hashtags,
        location: location
      };
    } catch (error) {
      console.error(`❌ Instagram posting failed for ${location}:`, error);
      return {
        success: false,
        reason: 'posting_failed',
        error: error.message,
        location: location,
        caption: caption,
        hashtags: hashtags,
        fullCaption: hashtags.length > 0 ? `${caption}\n\n${hashtags.join(' ')}` : caption,
        videoPath: videoPath
      };
    }
  }

  async postImage(imagePath, caption, location = 'sanAntonio', userId) {
    await this.refreshTokensForUser(userId);
    try {
      const account = this.getAccountForLocation(location);
      if (!account.businessAccountId) {
        const initialized = await this.initialize();
        if (!initialized[location]) {
          console.log(`📝 Instagram posting disabled for ${location} - saving post data for manual posting`);
          return {
            success: false,
            reason: 'instagram_not_configured',
            location: location,
            caption: caption,
            imagePath: imagePath
          };
        }
      }

      // Create container for image upload
      const containerResponse = await axios.post(`${this.baseUrl}/${account.businessAccountId}/media`, {
        media_type: 'IMAGE',
        image_url: imagePath, // In production, you'd upload to a public URL first
        caption: caption,
        access_token: account.accessToken
      });

      const containerId = containerResponse.data.id;

      // Publish the container
      const publishResponse = await axios.post(`${this.baseUrl}/${account.businessAccountId}/media_publish`, {
        creation_id: containerId,
        access_token: account.accessToken
      });

      console.log(`✅ Instagram image posted successfully to ${location} account`);
      return {
        success: true,
        mediaId: publishResponse.data.id,
        caption: caption,
        location: location
      };
    } catch (error) {
      console.error(`❌ Instagram image posting failed for ${location}:`, error);
      return {
        success: false,
        reason: 'posting_failed',
        error: error.message,
        location: location,
        caption: caption,
        imagePath: imagePath
      };
    }
  }

  async getAccountInfo(location = 'sanAntonio') {
    try {
      const account = this.getAccountForLocation(location);
      if (!account.businessAccountId) {
        const initialized = await this.initialize();
        if (!initialized[location]) {
          throw new Error(`Instagram not configured for ${location}`);
        }
      }

      const response = await axios.get(`${this.baseUrl}/${account.businessAccountId}`, {
        params: {
          access_token: account.accessToken,
          fields: 'id,username,name,profile_picture_url,followers_count,media_count'
        }
      });

      return { ...response.data, location: location };
    } catch (error) {
      console.error(`Error getting account info for ${location}:`, error);
      throw error;
    }
  }

  async getEngagement(mediaId, location = 'sanAntonio') {
    try {
      const account = this.getAccountForLocation(location);
      if (!account.businessAccountId) {
        const initialized = await this.initialize();
        if (!initialized[location]) {
          throw new Error(`Instagram not configured for ${location}`);
        }
      }

      const response = await axios.get(`${this.baseUrl}/${mediaId}/insights`, {
        params: {
          access_token: account.accessToken,
          metric: 'engagement,impressions,reach'
        }
      });

      return { ...response.data, location: location };
    } catch (error) {
      console.error(`Error getting engagement for ${location}:`, error);
      throw error;
    }
  }

  async validateCredentials(location = 'sanAntonio', userId) {
    await this.refreshTokensForUser(userId);
    try {
      const account = this.getAccountForLocation(location);
      if (!account.accessToken) {
        return false;
      }
      
      const initialized = await this.initialize();
      return initialized[location] || false;
    } catch (error) {
      console.error(`Instagram credentials validation failed for ${location}:`, error);
      return false;
    }
  }

  async addHashtags(caption, hashtags) {
    return `${caption}\n\n${hashtags.join(' ')}`;
  }

  async addLocation(caption, location) {
    return `${caption}\n📍 ${location}`;
  }

  async addCallToAction(caption, cta = 'DM for more details!') {
    return `${caption}\n\n${cta}`;
  }
}

module.exports = new InstagramService(); 