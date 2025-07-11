import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { VideoModel } from '../models/Video';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();
const videoModel = new VideoModel(pool);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// @route   POST /api/captions/generate
// @desc    Generate AI-powered caption
// @access  Private
router.post('/generate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      videoId,
      tone = 'professional',
      style = 'engaging',
      includeHashtags = true,
      maxLength = 2200,
      includeCallToAction = true,
    } = req.body;

    // Get video details
    const video = await videoModel.findById(videoId);
    if (!video || video.userId !== userId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // TODO: Integrate with OpenAI or similar AI service
    // For now, we'll create a template-based caption
    const caption = generateCaption({
      video,
      tone,
      style,
      includeHashtags,
      maxLength,
      includeCallToAction,
    });

    logger.info(`Generated caption for video: ${video.id} by user ${userId}`);

    res.json({
      caption,
      video: {
        id: video.id,
        title: video.title,
        category: video.category,
        propertyType: video.propertyType,
        location: video.location,
        price: video.price,
      }
    });
  } catch (error) {
    logger.error('Generate caption error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/captions/generate-batch
// @desc    Generate captions for multiple videos
// @access  Private
router.post('/generate-batch', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      videoIds,
      tone = 'professional',
      style = 'engaging',
      includeHashtags = true,
      maxLength = 2200,
      includeCallToAction = true,
    } = req.body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ error: 'Video IDs array is required' });
    }

    const captions = [];

    for (const videoId of videoIds) {
      const video = await videoModel.findById(videoId);
      if (video && video.userId === userId) {
        const caption = generateCaption({
          video,
          tone,
          style,
          includeHashtags,
          maxLength,
          includeCallToAction,
        });

        captions.push({
          videoId,
          caption,
          video: {
            id: video.id,
            title: video.title,
            category: video.category,
          }
        });
      }
    }

    logger.info(`Generated ${captions.length} captions for user ${userId}`);

    res.json({
      captions,
      total: captions.length,
    });
  } catch (error) {
    logger.error('Generate batch captions error:', error);
    res.status(500).json({ error: 'Server error' });
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

    res.json({ templates });
  } catch (error) {
    logger.error('Get caption templates error:', error);
    res.status(500).json({ error: 'Server error' });
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

    // TODO: Integrate with AI service for hashtag generation
    // For now, we'll use predefined hashtags
    const hashtags = generateHashtags({
      content,
      category,
      location,
      propertyType,
      price,
      count,
    });

    res.json({
      hashtags,
      count: hashtags.length,
    });
  } catch (error) {
    logger.error('Generate hashtags error:', error);
    res.status(500).json({ error: 'Server error' });
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

    res.json({ suggestions });
  } catch (error) {
    logger.error('Get hashtag suggestions error:', error);
    res.status(500).json({ error: 'Server error' });
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
      video = await videoModel.findById(videoId);
    }

    // TODO: Integrate with AI service for caption optimization
    const optimizedCaption = optimizeCaption({
      caption,
      video,
      optimizationType,
      targetLength,
      includeHashtags,
    });

    res.json({
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper functions
function generateCaption(options: {
  video: any;
  tone: string;
  style: string;
  includeHashtags: boolean;
  maxLength: number;
  includeCallToAction: boolean;
}): string {
  const { video, tone, style, includeHashtags, maxLength, includeCallToAction } = options;

  let caption = '';

  // Generate main caption based on video properties
  if (video.category === 'real-estate') {
    caption = `🏠 ${video.title}\n\n`;
    
    if (video.location) {
      caption += `📍 Location: ${video.location}\n`;
    }
    
    if (video.propertyType) {
      caption += `🏘️ Type: ${video.propertyType}\n`;
    }
    
    if (video.price) {
      caption += `💰 Price: $${video.price.toLocaleString()}\n`;
    }
    
    caption += `\n${video.description || 'Check out this amazing property!'}`;
  } else {
    caption = `🎬 ${video.title}\n\n`;
    caption += video.description || 'Fun real estate content coming your way!';
  }

  // Add call to action
  if (includeCallToAction) {
    caption += '\n\n💬 What do you think? Drop a comment below! 👇';
  }

  // Add hashtags
  if (includeHashtags) {
    const hashtags = generateHashtags({
      content: caption,
      category: video.category,
      location: video.location,
      propertyType: video.propertyType,
      price: video.price,
      count: 15,
    });
    
    caption += `\n\n${hashtags.join(' ')}`;
  }

  // Truncate if too long
  if (caption.length > maxLength) {
    caption = caption.substring(0, maxLength - 3) + '...';
  }

  return caption;
}

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
  const { category, location, propertyType } = options;

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
  const { caption, optimizationType, targetLength, includeHashtags } = options;

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