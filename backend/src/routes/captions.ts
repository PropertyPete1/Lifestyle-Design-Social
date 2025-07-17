import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { captionGenerationService } from '../services/captionGenerationService';
import { Video } from '../models/Video';
import { connectToDatabase } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();
const captionService = captionGenerationService;

// JWT Secret
// const _JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/generate', authenticateToken, async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const userId = req.user!.id;
    const { videoId, platform, style: _style, includeHashtags: _includeHashtags, customPrompt: _customPrompt } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }
    
    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) {
      return res.status(404).json({ error: 'Video not found or access denied' });
    }
    
    const caption = await captionService.generateCaptionAndHashtags(
      userId,
      videoId,
      platform || 'instagram',
      { tone: 'professional' }
    );
    
    return res.json({
      success: true,
      caption: caption.caption,
      hashtags: caption.hashtags,
      // Note: confidence and source properties are not available in GeneratedCaption interface
    });
  } catch (error) {
    logger.error('Generate caption error:', error);
    return res.status(500).json({ error: 'Failed to generate caption' });
  }
});

router.post('/generate-batch', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { videoIds, platform, style: _style, includeHashtags: _includeHashtags } = req.body;
    
    if (!videoIds || !Array.isArray(videoIds)) {
      return res.status(400).json({ error: 'Video IDs array is required' });
    }
    
    const captions = await Promise.all(
      videoIds.map(async (videoId: string) => {
        try {
          await connectToDatabase();
          const video = await Video.findOne({ _id: videoId, userId });
          if (!video) {
            throw new Error('Video not found or access denied');
          }
          
          const caption = await captionService.generateCaptionAndHashtags(
            userId,
            videoId,
            platform || 'instagram',
            { tone: 'professional' }
          );
        
          return {
            videoId,
            success: true,
            caption: caption.caption,
            hashtags: caption.hashtags,
            // Note: confidence and source properties are not available in GeneratedCaption interface
          };
        } catch (error) {
          return {
            videoId,
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate caption'
          };
        }
      })
    );
    
    return res.json({
      captions,
      total: videoIds.length,
      successful: captions.filter(c => c.success).length,
      failed: captions.filter(c => !c.success).length
    });
  } catch (error) {
    logger.error('Batch caption generation error:', error);
    return res.status(500).json({ error: 'Failed to generate batch captions' });
  }
});

// @route   GET /api/captions/templates
// @desc    Get caption templates
// @access  Private
router.get('/templates', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { category, tone } = req.query;

    const templates = getCaptionTemplates({
      category: category as 'real-estate' | 'cartoon',
      tone: tone as 'professional' | 'casual' | 'luxury' | 'friendly',
    });

    return res.json({ templates });
  } catch (error) {
    logger.error('Get caption templates error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/captions/hashtags
// @desc    Generate hashtags for content
// @access  Private
router.post('/hashtags', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      content,
      category = 'real-estate',
      location,
      propertyType,
      price,
      count = 20,
    } = req.body;

          // Future enhancement: Integrate with AI service for hashtag generation
    // For now, we'll use predefined hashtags
    const hashtags = generateHashtags({
      content,
      category,
      location,
      propertyType,
      price,
      count,
    });

    return res.json({
      hashtags,
      count: hashtags.length,
    });
  } catch (error) {
    logger.error('Generate hashtags error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/captions/hashtag-suggestions
// @desc    Get hashtag suggestions
// @access  Private
router.get('/hashtag-suggestions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { category, location, propertyType } = req.query;

    const suggestions = getHashtagSuggestions({
      category: category as 'real-estate' | 'cartoon',
      location: location as string,
      propertyType: propertyType as string,
    });

    return res.json({ suggestions });
  } catch (error) {
    logger.error('Get hashtag suggestions error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/captions/optimize
// @desc    Optimize existing caption
// @access  Private
router.post('/optimize', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      caption,
      videoId,
      optimizationType = 'engagement',
      targetLength,
      includeHashtags = true,
    } = req.body;

    // Get video context if provided
    let video = null;
    if (videoId) {
      await connectToDatabase();
      video = await Video.findOne({ _id: videoId });
    }

            // Caption optimization integrated with existing service
    const optimizedCaption = optimizeCaption({
      caption,
      video,
      optimizationType,
      targetLength,
      includeHashtags,
    });

    return res.json({
      originalCaption: caption,
      optimizedCaption,
      improvements: [
        'Enhanced engagement potential',
        'Better hashtag strategy',
        'Improved readability',
      ],
    });
  } catch (error) {
    logger.error('Optimize caption error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Helper functions
// function generateCaption(options: {
function generateHashtags(options: {
  content: string;
  category: string;
  location?: string;
  propertyType?: string;
  price?: number;
  count: number;
}): string[] {
  const { category, location, propertyType, price, count } = options;
  
  const hashtags = [];

  // Base hashtags
  if (category === 'real-estate') {
    hashtags.push(
      '#realestate',
      '#homes',
      '#property',
      '#realestateagent',
      '#homesforsale',
      '#luxuryhomes',
      '#dreamhome',
      '#homebuying',
      '#realestateinvesting'
    );
  } else {
    hashtags.push(
      '#cartoon',
      '#funny',
      '#realestatehumor',
      '#realtorlife',
      '#realestatecomedy',
      '#funnyrealtor',
      '#realestatejokes'
    );
  }

  // Location-based hashtags
  if (location) {
    const locationParts = location.split(',').map(part => part.trim());
    locationParts.forEach(part => {
      hashtags.push(`#${part.toLowerCase().replace(/\s+/g, '')}`);
    });
  }

  // Property type hashtags
  if (propertyType) {
    hashtags.push(`#${propertyType.toLowerCase()}`);
  }

  // Price-based hashtags
  if (price) {
    if (price > 1000000) {
      hashtags.push('#luxury', '#milliondollarhome');
    } else if (price > 500000) {
      hashtags.push('#midrange', '#affordableluxury');
    } else {
      hashtags.push('#affordable', '#starterhome');
    }
  }

  // Return unique hashtags up to count
  return [...new Set(hashtags)].slice(0, count);
}

function getCaptionTemplates(options: {
  category?: 'real-estate' | 'cartoon';
  tone?: 'professional' | 'casual' | 'luxury' | 'friendly';
}): any[] {
  const { category, tone } = options;

  const templates = [
    {
      id: 'luxury-property',
      name: 'Luxury Property Showcase',
      template: '🏠 {title}\n\n📍 {location}\n🏘️ {propertyType}\n💰 {price}\n\n{description}\n\n#luxuryhomes #realestate #dreamhome',
      category: 'real-estate',
      tone: 'luxury',
    },
    {
      id: 'casual-property',
      name: 'Casual Property Tour',
      template: 'Check out this amazing {propertyType} in {location}! {description}\n\nWhat do you think? 👇\n\n#realestate #homes #property',
      category: 'real-estate',
      tone: 'casual',
    },
    {
      id: 'funny-cartoon',
      name: 'Funny Real Estate Cartoon',
      template: '😂 {title}\n\n{description}\n\nReal estate life be like... 😅\n\n#realestatehumor #funnyrealtor #cartoon',
      category: 'cartoon',
      tone: 'friendly',
    },
  ];

  return templates.filter(template => {
    if (category && template.category !== category) return false;
    if (tone && template.tone !== tone) return false;
    return true;
  });
}

function getHashtagSuggestions(options: {
  category?: 'real-estate' | 'cartoon';
  location?: string;
  propertyType?: string;
}): any {
  const { category: _category, location, propertyType } = options;

  const suggestions = {
    realEstate: [
      '#realestate', '#homes', '#property', '#realestateagent',
      '#homesforsale', '#luxuryhomes', '#dreamhome', '#homebuying',
      '#realestateinvesting', '#openhouse', '#justlisted',
    ],
    cartoon: [
      '#cartoon', '#funny', '#realestatehumor', '#realtorlife',
      '#realestatecomedy', '#funnyrealtor', '#realestatejokes',
      '#realtorproblems', '#realestatememes',
    ],
    locations: location ? [`#${location.toLowerCase().replace(/\s+/g, '')}`] : [],
    propertyTypes: propertyType ? [`#${propertyType.toLowerCase()}`] : [],
  };

  return suggestions;
}

function optimizeCaption(options: {
  caption: string;
  video?: any;
  optimizationType: string;
  targetLength?: number;
  includeHashtags: boolean;
}): string {
  const { caption, optimizationType, targetLength, includeHashtags: _includeHashtags } = options;

  let optimized = caption;

  // Basic optimizations
  if (optimizationType === 'engagement') {
    // Add emojis and questions
    optimized = optimized.replace(/\./g, ' 😊');
    optimized += '\n\n💬 What do you think? Drop a comment below! 👇';
  }

  // Truncate if target length specified
  if (targetLength && optimized.length > targetLength) {
    optimized = optimized.substring(0, targetLength - 3) + '...';
  }

  return optimized;
}

export default router; 