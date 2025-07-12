const OpenAI = require('openai');
const { getDB } = require('../config/database');

// Initialize OpenAI only if API key is available
let openai = null;
let isInitialized = false;

async function getApiKeyFromDB(keyName) {
  try {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT keyValue FROM api_keys WHERE keyName = ? AND isActive = 1 LIMIT 1',
        [keyName.toLowerCase()],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.keyValue : null);
        }
      );
    });
  } catch (error) {
    console.error('Error getting API key from database:', error);
    return null;
  }
}

async function initializeOpenAI() {
  if (isInitialized) return !!openai;
  
  let apiKey = process.env.OPENAI_API_KEY;
  
  // If not in environment, check database
  if (!apiKey) {
    apiKey = await getApiKeyFromDB('openai');
  }
  
  if (apiKey) {
    try {
      openai = new OpenAI({
        apiKey: apiKey,
      });
      console.log('✅ OpenAI service initialized');
      isInitialized = true;
      return true;
    } catch (error) {
      console.warn('⚠️ OpenAI service initialization failed:', error.message);
      isInitialized = true;
      return false;
    }
  } else {
    console.log('ℹ️ OpenAI API key not configured - AI features disabled');
    isInitialized = true;
    return false;
  }
}

// Initialize on startup
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI service initialized from environment');
    isInitialized = true;
  } catch (error) {
    console.warn('⚠️ OpenAI service initialization failed:', error.message);
  }
}

class AIService {
  constructor() {
    this.model = process.env.AI_MODEL || 'gpt-4';
    this.maxTokens = parseInt(process.env.MAX_TOKENS) || 500;
  }

  async _checkConfiguration() {
    if (!isInitialized) {
      await initializeOpenAI();
    }
    
    if (!openai) {
      throw new Error('OpenAI service not configured. Please add your OpenAI API key in Settings.');
    }
  }

  async generateCaption(videoData) {
    try {
      await this._checkConfiguration();
      const prompt = this.buildCaptionPrompt(videoData);
      
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert real estate marketing specialist who creates viral, engaging social media captions that drive buyer interest and generate leads.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.8
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating caption:', error);
      if (error.message.includes('not configured')) {
        return 'AI caption generation not available - OpenAI API key not configured';
      }
      throw new Error('Failed to generate AI caption');
    }
  }

  async generateHashtags(videoData, platform = 'both') {
    try {
      await this._checkConfiguration();
      const prompt = this.buildHashtagPrompt(videoData, platform);
      
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert who creates high-performing hashtags for real estate content. Return only hashtags separated by spaces, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      const hashtags = response.choices[0].message.content.trim();
      return hashtags.split(' ').filter(tag => tag.startsWith('#'));
    } catch (error) {
      console.error('Error generating hashtags:', error);
      if (error.message.includes('not configured')) {
        return ['#realestate', '#property', '#homes'];
      }
      throw new Error('Failed to generate hashtags');
    }
  }

  async suggestOptimalTimes(userTimezone = 'America/New_York') {
    try {
      await this._checkConfiguration();
      const prompt = `Based on real estate industry data and social media engagement patterns, suggest the 5 best times to post real estate videos for maximum engagement. Consider:
      - When potential buyers are most active
      - Different time zones
      - Weekday vs weekend patterns
      - Platform-specific optimal times (Twitter vs Instagram)
      
      User timezone: ${userTimezone}
      
      Return only the times in 24-hour format (HH:MM), separated by commas.`;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a social media analytics expert specializing in real estate marketing timing optimization.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.5
      });

      const times = response.choices[0].message.content.trim();
      return times.split(',').map(time => time.trim());
    } catch (error) {
      console.error('Error suggesting optimal times:', error);
      // Fallback to default optimal times
      return ['09:00', '12:00', '15:00', '18:00', '20:00'];
    }
  }

  async generateCompletePost(videoData, platform = 'both') {
    try {
      await this._checkConfiguration();

      const [caption, hashtags] = await Promise.all([
        this.generateCaption(videoData),
        this.generateHashtags(videoData, platform)
      ]);

      return {
        caption,
        hashtags,
        aiGenerated: {
          caption: true,
          hashtags: true,
          timing: false
        }
      };
    } catch (error) {
      console.error('Error generating complete post:', error);
      // Return fallback content
      return {
        caption: 'Check out this amazing real estate content!',
        hashtags: ['#realestate', '#property', '#homes'],
        aiGenerated: {
          caption: false,
          hashtags: false,
          timing: false
        }
      };
    }
  }

  buildCaptionPrompt(videoData) {
    const {
      title,
      description,
      category,
      location,
      price,
      propertyType,
      tags
    } = videoData;

    // Ensure tags is always an array
    const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);

    return `Create a compelling, viral-worthy social media caption for a real estate video targeting BUYERS looking to purchase a home within 30-90 days:

Title: ${title || 'Real Estate Video'}
Description: ${description || 'No description provided'}
Category: ${category || 'Real Estate'}
Property Type: ${propertyType || 'Property'}
Location: ${location ? (typeof location === 'object' ? `${location.city || ''}, ${location.state || ''}` : location) : 'Location not specified'}
Price: ${price ? `$${price.toLocaleString()}` : 'Price not specified'}
Tags: ${tagsArray.length > 0 ? tagsArray.join(', ') : 'No tags'}

TARGET AUDIENCE: Active homebuyers (30-90 day timeline)

Requirements:
- Keep it under 280 characters for Twitter compatibility
- Create URGENCY for buyers (limited time, market conditions)
- Focus on BUYER benefits (investment potential, lifestyle, equity)
- Include emotional triggers that drive buyer engagement
- Add FOMO (fear of missing out) for active buyers
- Use power words that convert viewers to buyers
- Include clear call-to-action for buyer inquiries
- Make it feel personal and authentic
- Optimize for both Twitter and Instagram
- Focus on the lifestyle and investment potential
- Mention market timing and buyer advantages
- Include buyer-specific hashtags

Make it engaging, shareable, and designed to generate BUYER leads and inquiries.`;
  }

  buildHashtagPrompt(videoData, platform) {
    const {
      category,
      location,
      propertyType,
      price
    } = videoData;

    const platformSpecific = platform === 'twitter' 
      ? 'Focus on Twitter hashtags (trending, real estate, investment)'
      : platform === 'instagram'
      ? 'Focus on Instagram hashtags (lifestyle, real estate, visual content)'
      : 'Create hashtags that work well on both Twitter and Instagram';

    return `Generate 15-20 high-performing hashtags for a real estate video with these details:

Category: ${category}
Property Type: ${propertyType}
Location: ${location ? `${location.city}, ${location.state}` : 'General'}
Price Range: ${price ? (price > 500000 ? 'Luxury' : price > 200000 ? 'Mid-range' : 'Affordable') : 'Not specified'}

${platformSpecific}

Include:
- Location-based hashtags
- Real estate industry hashtags
- Investment-focused hashtags
- Lifestyle hashtags
- Trending real estate hashtags
- Platform-specific hashtags

Return only the hashtags separated by spaces, no explanations.`;
  }

  async analyzeEngagement(postData) {
    try {
      await this._checkConfiguration();
      const prompt = `Analyze this social media post performance and provide insights:

Post Details:
- Platform: ${postData.platform}
- Caption: ${postData.content.caption}
- Hashtags: ${postData.content.hashtags.join(', ')}
- Engagement: ${JSON.stringify(postData.engagement)}

Provide 3 specific recommendations to improve future post performance.`;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a social media analytics expert who provides actionable insights for improving real estate content performance.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error analyzing engagement:', error);
      if (error.message.includes('not configured')) {
        return 'AI analysis not available - OpenAI API key not configured';
      }
      throw new Error('Failed to analyze engagement');
    }
  }
}

module.exports = new AIService(); 