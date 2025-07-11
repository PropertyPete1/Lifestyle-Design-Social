import { logger } from '../utils/logger';
import { VideoModel } from '../models/Video';
import { CaptionModel } from '../models/Caption';
import { HashtagModel } from '../models/Hashtag';
import { pool } from '../config/database';

export interface CaptionGenerationOptions {
  videoId: string;
  tone?: 'professional' | 'casual' | 'funny' | 'luxury';
  includeHashtags?: boolean;
  maxLength?: number;
  includeEmojis?: boolean;
  targetAudience?: string;
  callToAction?: string;
}

export interface GeneratedCaption {
  caption: string;
  hashtags: string[];
  emojis: string[];
  length: number;
  tone: string;
  callToAction?: string;
}

export interface CaptionTemplate {
  id: string;
  template: string;
  tone: string;
  category: string;
  hashtags: string[];
  emojis: string[];
  callToAction: string;
}

export class CaptionGenerationService {
  private videoModel: VideoModel;
  private captionModel: CaptionModel;
  private hashtagModel: HashtagModel;

  constructor() {
    this.videoModel = new VideoModel(pool);
    this.captionModel = new CaptionModel(pool);
    this.hashtagModel = new HashtagModel(pool);
  }

  /**
   * Generate caption for a video
   */
  async generateCaption(options: CaptionGenerationOptions): Promise<GeneratedCaption> {
    try {
      logger.info(`Generating caption for video ${options.videoId}`);

      const video = await this.videoModel.findById(options.videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      // Get caption template based on video category and tone
      const template = await this.getCaptionTemplate(video.category, options.tone || 'professional');

      // Generate caption using template
      const caption = await this.fillCaptionTemplate(template, video, options);

      // Add hashtags if requested
      let hashtags: string[] = [];
      if (options.includeHashtags) {
        hashtags = await this.generateHashtags(video.category, options.tone || 'professional');
      }

      // Add emojis if requested
      let emojis: string[] = [];
      if (options.includeEmojis) {
        emojis = this.getEmojisForCategory(video.category);
      }

      const result: GeneratedCaption = {
        caption,
        hashtags,
        emojis,
        length: caption.length,
        tone: options.tone || 'professional',
        callToAction: template.callToAction,
      };

      // Save generated caption
      await this.captionModel.create({
        videoId: options.videoId,
        content: caption,
        tone: options.tone || 'professional',
        hashtags,
        generatedAt: new Date(),
      });

      logger.info(`Generated caption for video ${options.videoId}: ${caption.length} characters`);
      return result;
    } catch (error) {
      logger.error('Failed to generate caption:', error);
      throw error;
    }
  }

  /**
   * Get caption template based on category and tone
   */
  private async getCaptionTemplate(category: string, tone: string): Promise<CaptionTemplate> {
    try {
      const templates = await this.captionModel.getTemplatesByCategory(category, tone);
      
      if (templates.length > 0) {
        // Return random template from available ones
        return templates[Math.floor(Math.random() * templates.length)];
      }

      // Return default template if none found
      return this.getDefaultTemplate(category, tone);
    } catch (error) {
      logger.error('Failed to get caption template:', error);
      return this.getDefaultTemplate(category, tone);
    }
  }

  /**
   * Get default caption template
   */
  private getDefaultTemplate(category: string, tone: string): CaptionTemplate {
    const templates: Record<string, CaptionTemplate> = {
      'real-estate_professional': {
        id: 'default_professional',
        template: '🏠 {propertyType} in {location} | {price} | {features} | {callToAction}',
        tone: 'professional',
        category: 'real-estate',
        hashtags: ['#realestate', '#luxuryhomes', '#property', '#homesforsale'],
        emojis: ['🏠', '💰', '📍'],
        callToAction: 'DM for more details!',
      },
      'real-estate_casual': {
        id: 'default_casual',
        template: 'Check out this amazing {propertyType} in {location}! {features} {callToAction}',
        tone: 'casual',
        category: 'real-estate',
        hashtags: ['#realestate', '#homes', '#property', '#dreamhome'],
        emojis: ['🏠', '✨', '💫'],
        callToAction: 'Let me know what you think!',
      },
      'cartoon_funny': {
        id: 'default_cartoon',
        template: '😂 Real estate agents be like... {funnyScenario} {callToAction}',
        tone: 'funny',
        category: 'cartoon',
        hashtags: ['#realestatehumor', '#realtorlife', '#funny', '#cartoon'],
        emojis: ['😂', '🤣', '😅'],
        callToAction: 'Tag a realtor friend!',
      },
      'cartoon_professional': {
        id: 'default_cartoon_professional',
        template: 'Real estate humor: {scenario} | {lesson} | {callToAction}',
        tone: 'professional',
        category: 'cartoon',
        hashtags: ['#realestate', '#realtorhumor', '#realestatehumor'],
        emojis: ['🏠', '😊', '💡'],
        callToAction: 'Follow for more insights!',
      },
    };

    const key = `${category}_${tone}`;
    return templates[key] || templates['real-estate_professional'];
  }

  /**
   * Fill caption template with video data
   */
  private async fillCaptionTemplate(template: CaptionTemplate, video: any, options: CaptionGenerationOptions): Promise<string> {
    let caption = template.template;

    // Replace placeholders with actual data
    const replacements: Record<string, string> = {
      '{propertyType}': video.propertyType || 'Property',
      '{location}': video.location || 'Central Texas',
      '{price}': video.price ? `$${video.price.toLocaleString()}` : 'Price on request',
      '{features}': video.features?.join(' | ') || 'Amazing features',
      '{callToAction}': template.callToAction,
      '{funnyScenario}': this.getRandomFunnyScenario(),
      '{scenario}': this.getRandomScenario(),
      '{lesson}': this.getRandomLesson(),
    };

    // Apply replacements
    for (const [placeholder, value] of Object.entries(replacements)) {
      caption = caption.replace(new RegExp(placeholder, 'g'), value);
    }

    // Add emojis if requested
    if (options.includeEmojis && template.emojis.length > 0) {
      caption = `${template.emojis.join(' ')} ${caption}`;
    }

    // Truncate if too long
    const maxLength = options.maxLength || 2200;
    if (caption.length > maxLength) {
      caption = caption.substring(0, maxLength - 3) + '...';
    }

    return caption;
  }

  /**
   * Generate hashtags for a category and tone
   */
  private async generateHashtags(category: string, tone: string): Promise<string[]> {
    try {
      const hashtags = await this.hashtagModel.getByCategory(category, tone);
      
      if (hashtags.length > 0) {
        // Return random selection of hashtags (max 30)
        const shuffled = hashtags.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(30, hashtags.length));
      }

      // Return default hashtags
      return this.getDefaultHashtags(category, tone);
    } catch (error) {
      logger.error('Failed to generate hashtags:', error);
      return this.getDefaultHashtags(category, tone);
    }
  }

  /**
   * Get default hashtags
   */
  private getDefaultHashtags(category: string, tone: string): string[] {
    const defaultHashtags: Record<string, string[]> = {
      'real-estate_professional': [
        '#realestate', '#luxuryhomes', '#property', '#homesforsale', '#realestateagent',
        '#luxuryrealestate', '#dreamhome', '#homeselling', '#homebuying', '#realestateinvesting',
        '#centraltexas', '#texasrealestate', '#austinhomes', '#luxuryproperties', '#realestatephotography',
      ],
      'real-estate_casual': [
        '#realestate', '#homes', '#property', '#dreamhome', '#homegoals',
        '#realestateagent', '#homesforsale', '#homebuying', '#homeselling', '#realestateinvesting',
        '#centraltexas', '#texasrealestate', '#austinhomes', '#luxuryhomes', '#realestatephotography',
      ],
      'cartoon_funny': [
        '#realestatehumor', '#realtorlife', '#funny', '#cartoon', '#realestateagent',
        '#realtorhumor', '#realestatefunny', '#realtorproblems', '#realestatecartoon', '#funnyrealtor',
        '#realestatememes', '#realtormemes', '#realestatehumor', '#realtorlife', '#realestatefun',
      ],
      'cartoon_professional': [
        '#realestate', '#realtorhumor', '#realestatehumor', '#realestateagent', '#realtorlife',
        '#realestatecartoon', '#realestatefun', '#realtorhumor', '#realestatefunny', '#realtorproblems',
        '#realestatememes', '#realtormemes', '#realestatehumor', '#realtorlife', '#realestatefun',
      ],
    };

    const key = `${category}_${tone}`;
    return defaultHashtags[key] || defaultHashtags['real-estate_professional'];
  }

  /**
   * Get emojis for category
   */
  private getEmojisForCategory(category: string): string[] {
    const emojiMap: Record<string, string[]> = {
      'real-estate': ['🏠', '💰', '📍', '✨', '💫', '🔥', '💎', '🏡', '🌆', '🌇'],
      'cartoon': ['😂', '🤣', '😅', '😊', '🤪', '😎', '🤔', '💡', '🎯', '🎪'],
    };

    return emojiMap[category] || emojiMap['real-estate'];
  }

  /**
   * Get random funny scenario for cartoons
   */
  private getRandomFunnyScenario(): string {
    const scenarios = [
      'when clients ask "is this the final price?" for the 10th time',
      'trying to explain why a 2-bedroom house costs $500k',
      'when buyers want to see 50 houses but only buy one',
      'the classic "we love it but need to think about it"',
      'when sellers think their house is worth way more than it is',
      'trying to schedule showings with busy clients',
      'when clients ask if they can paint the walls before closing',
      'the eternal "is this a good investment?" question',
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  /**
   * Get random scenario for professional cartoons
   */
  private getRandomScenario(): string {
    const scenarios = [
      'Client expectations vs. reality',
      'The art of negotiation',
      'Market timing challenges',
      'Property value assessment',
      'Client communication strategies',
      'Market trend analysis',
      'Property presentation techniques',
      'Investment decision making',
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  /**
   * Get random lesson for professional cartoons
   */
  private getRandomLesson(): string {
    const lessons = [
      'Always do your research',
      'Patience pays off',
      'Market knowledge is key',
      'Communication is everything',
      'Trust your instincts',
      'Timing is crucial',
      'Quality over quantity',
      'Relationships matter',
    ];
    return lessons[Math.floor(Math.random() * lessons.length)];
  }

  /**
   * Get caption statistics
   */
  async getCaptionStats(): Promise<{
    totalGenerated: number;
    averageLength: number;
    mostUsedTone: string;
    mostUsedHashtags: string[];
  }> {
    try {
      const stats = await this.captionModel.getStats();
      return {
        totalGenerated: stats.totalCaptions || 0,
        averageLength: stats.averageLength || 0,
        mostUsedTone: stats.mostUsedTone || 'professional',
        mostUsedHashtags: stats.mostUsedHashtags || [],
      };
    } catch (error) {
      logger.error('Failed to get caption stats:', error);
      throw error;
    }
  }

  /**
   * Save custom caption template
   */
  async saveCustomTemplate(template: Omit<CaptionTemplate, 'id'>): Promise<string> {
    try {
      const result = await this.captionModel.createTemplate(template);
      logger.info(`Saved custom caption template: ${result.id}`);
      return result.id;
    } catch (error) {
      logger.error('Failed to save custom template:', error);
      throw error;
    }
  }
}

export default CaptionGenerationService; 