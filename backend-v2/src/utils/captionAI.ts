import axios from 'axios';
import SettingsModel from '../models/SettingsModel';

/**
 * Rewrite caption using OpenAI for different platforms
 */
export const rewriteCaption = async (originalCaption: string, platform: 'instagram' | 'youtube'): Promise<string> => {
  try {
    const settings = await SettingsModel.findOne();
    
    if (!settings?.openaiApi) {
      console.log('⚠️ OpenAI API key not configured, using fallback caption processing');
      return fallbackCaptionRewrite(originalCaption, platform);
    }

    const platformPrompts = {
      instagram: `Rewrite this Instagram caption to be more engaging and viral-worthy while keeping the core message. 
        Requirements:
        - Remove all dashes (-)
        - Keep it under 150 characters
        - Make it more engaging and hook-worthy
        - Maintain any existing hashtags
        - Use emojis strategically
        - Focus on lifestyle/motivation themes
        
        Original caption: ${originalCaption}`,
        
      youtube: `Rewrite this as a compelling YouTube Shorts title and description.
        Requirements:
        - Create a clickbait-worthy title (under 60 characters)
        - Remove all dashes (-)
        - Focus on viral keywords like "This will change your life", "Secret to", etc.
        - Make it curiosity-driven
        - Include relevant hashtags
        
        Original caption: ${originalCaption}`
    };

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: platformPrompts[platform]
      }],
      max_tokens: 200,
      temperature: 0.8
    }, {
      headers: {
        'Authorization': `Bearer ${settings.openaiApi}`,
        'Content-Type': 'application/json'
      }
    });

    const rewrittenCaption = response.data.choices[0].message.content.trim();
    console.log(`🤖 AI rewrote caption for ${platform}: "${rewrittenCaption.substring(0, 50)}..."`);
    
    return rewrittenCaption;
    
  } catch (error) {
    console.error(`❌ AI caption generation failed for ${platform}:`, error);
    return fallbackCaptionRewrite(originalCaption, platform);
  }
};

/**
 * Fallback caption processing when AI is not available
 */
const fallbackCaptionRewrite = (originalCaption: string, platform: 'instagram' | 'youtube'): string => {
  // Remove dashes and clean up
  let cleaned = originalCaption.replace(/-/g, '').trim();
  
  if (platform === 'instagram') {
    // Add some engaging elements for Instagram
    const engagingPrefixes = ['💫', '🔥', '✨', '🚀', '💯'];
    const randomPrefix = engagingPrefixes[Math.floor(Math.random() * engagingPrefixes.length)];
    
    if (cleaned.length > 140) {
      cleaned = cleaned.substring(0, 137) + '...';
    }
    
    return `${randomPrefix} ${cleaned}`;
  } else {
    // YouTube format
    if (cleaned.length > 60) {
      cleaned = cleaned.substring(0, 57) + '...';
    }
    
    const hooks = ['This will blow your mind!', 'You won\'t believe this...', 'Life-changing advice:', 'The secret to:'];
    const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
    
    return `${randomHook} ${cleaned}`;
  }
};

/**
 * Generate optimized hashtags for different platforms
 */
export const generateOptimizedHashtags = async (caption: string, platform: 'instagram' | 'youtube'): Promise<string[]> => {
  const instagramTags = [
    'mindset', 'motivation', 'lifestyle', 'success', 'entrepreneur', 
    'inspiration', 'goals', 'hustle', 'grind', 'manifest', 'wealth',
    'freedom', 'discipline', 'focus', 'growth', 'winning', 'luxury',
    'blessed', 'grateful', 'powerful', 'unstoppable', 'vision',
    'purpose', 'passion', 'excellence', 'leadership', 'achievement'
  ];
  
  const youtubeTags = [
    'shorts', 'viral', 'trending', 'fyp', 'motivation', 'success',
    'lifestyle', 'mindset', 'tips', 'hack', 'secret', 'truth',
    'millionaire', 'entrepreneur', 'wealth', 'money', 'business',
    'inspiration', 'wisdom', 'powerful', 'life', 'change'
  ];
  
  const baseTags = platform === 'instagram' ? instagramTags : youtubeTags;
  
  // Extract existing hashtags from caption
  const existingTags = extractHashtagsFromText(caption);
  
  // Shuffle and combine tags
  const shuffledTags = [...baseTags].sort(() => 0.5 - Math.random());
  const combinedTags = [...new Set([...existingTags, ...shuffledTags])];
  
  // Return optimized selection
  return combinedTags.slice(0, platform === 'instagram' ? 25 : 15);
};

/**
 * Extract hashtags from text
 */
const extractHashtagsFromText = (text: string): string[] => {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = text.match(hashtagRegex) || [];
  return matches.map(tag => tag.slice(1)); // Remove # symbol
};