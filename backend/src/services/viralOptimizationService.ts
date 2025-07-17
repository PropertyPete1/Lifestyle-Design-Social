import { logger } from '../utils/logger';
import { Video } from '../models/Video';
import { ViralOptimization } from '../models/ViralOptimization';

import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import { promises as fs } from 'fs';

export interface ViralHook {
  id: string;
  type: HookType;
  text: string;
  timing: number; // seconds from start
  duration: number; // seconds
  position: TextPosition;
  style: TextStyle;
  animation: AnimationType;
  category: string;
  effectiveness: number; // 0-1 score
  platform: string[];
}

export type HookType = 
  | 'question'
  | 'controversy'
  | 'curiosity'
  | 'emotion'
  | 'shock'
  | 'trend'
  | 'challenge'
  | 'countdown'
  | 'transformation'
  | 'reveal';

export interface TextPosition {
  x: number; // percentage from left
  y: number; // percentage from top
  anchor: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shadow: boolean;
  bold: boolean;
  italic: boolean;
  opacity: number;
}

export type AnimationType = 
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'bounce'
  | 'typewriter'
  | 'pulse'
  | 'shake'
  | 'none';

export interface ViralOptimizationRequest {
  videoId: string;
  platform: string;
  targetAudience: string;
  videoCategory: string;
  customPrompt?: string;
  hookTypes?: HookType[];
  maxHooks?: number;
}

export interface ViralOptimizationResult {
  videoId: string;
  hooks: ViralHook[];
  optimizedVideoPath: string;
  originalVideoPath: string;
  processingTime: number;
  effectiveness: number;
  recommendations: string[];
}

export interface ViralTemplate {
  id: string;
  name: string;
  category: string;
  hookType: HookType;
  textTemplates: string[];
  platforms: string[];
  effectiveness: number;
  targetAudience: string[];
  examples: string[];
}

class ViralOptimizationService {
  private readonly OUTPUT_DIR = process.env.VIRAL_OUTPUT_DIR || './viral-videos';
  private readonly FONT_DIR = process.env.FONT_DIR || './fonts';

  private readonly VIRAL_TEMPLATES: ViralTemplate[] = [
    {
      id: 'real_estate_question',
      name: 'Real Estate Question Hook',
      category: 'real_estate',
      hookType: 'question',
      textTemplates: [
        'Would you live here for $1M?',
        'Is this house worth the price?',
        'Would you buy this property?',
        'Dream home or overpriced?',
        'Perfect family home?',
        'Investment or money pit?',
        'Your next home?'
      ],
      platforms: ['tiktok', 'instagram', 'youtube'],
      effectiveness: 0.85,
      targetAudience: ['buyers', 'investors', 'general'],
      examples: ['Would you live here for $1M?', 'Is this house worth the price?']
    },
    {
      id: 'real_estate_controversy',
      name: 'Real Estate Controversy Hook',
      category: 'real_estate',
      hookType: 'controversy',
      textTemplates: [
        'This house is NOT worth $2M',
        'Overpriced or fair market?',
        'Why this house will lose value',
        'Biggest mistake buyers make',
        'This neighborhood is changing',
        'Hidden problems with this property'
      ],
      platforms: ['tiktok', 'instagram'],
      effectiveness: 0.78,
      targetAudience: ['buyers', 'investors'],
      examples: ['This house is NOT worth $2M', 'Overpriced or fair market?']
    },
    {
      id: 'real_estate_curiosity',
      name: 'Real Estate Curiosity Hook',
      category: 'real_estate',
      hookType: 'curiosity',
      textTemplates: [
        'Wait until you see inside...',
        'You won\'t believe what\'s behind this door',
        'The secret room that changes everything',
        'This house has a hidden feature',
        'What they don\'t tell you about this area',
        'The surprising truth about this price'
      ],
      platforms: ['tiktok', 'instagram', 'youtube'],
      effectiveness: 0.82,
      targetAudience: ['buyers', 'general'],
      examples: ['Wait until you see inside...', 'You won\'t believe what\'s behind this door']
    },
    {
      id: 'real_estate_emotion',
      name: 'Real Estate Emotion Hook',
      category: 'real_estate',
      hookType: 'emotion',
      textTemplates: [
        'This house will make you cry',
        'The home that changed my life',
        'Why this property broke my heart',
        'The most beautiful home I\'ve seen',
        'This house has so much character',
        'A home with incredible history'
      ],
      platforms: ['instagram', 'youtube'],
      effectiveness: 0.75,
      targetAudience: ['buyers', 'general'],
      examples: ['This house will make you cry', 'The home that changed my life']
    },
    {
      id: 'real_estate_transformation',
      name: 'Real Estate Transformation Hook',
      category: 'real_estate',
      hookType: 'transformation',
      textTemplates: [
        'Before vs After: Mind blown',
        'This renovation is incredible',
        'From disaster to dream home',
        'The transformation you need to see',
        'How we turned this around',
        'The flip that changed everything'
      ],
      platforms: ['tiktok', 'instagram', 'youtube'],
      effectiveness: 0.88,
      targetAudience: ['investors', 'general'],
      examples: ['Before vs After: Mind blown', 'This renovation is incredible']
    },
    {
      id: 'real_estate_reveal',
      name: 'Real Estate Reveal Hook',
      category: 'real_estate',
      hookType: 'reveal',
      textTemplates: [
        'The price will shock you',
        'You won\'t guess the square footage',
        'The age of this house is crazy',
        'This location is everything',
        'The story behind this property',
        'What this house sold for'
      ],
      platforms: ['tiktok', 'instagram', 'youtube'],
      effectiveness: 0.80,
      targetAudience: ['buyers', 'investors', 'general'],
      examples: ['The price will shock you', 'You won\'t guess the square footage']
    }
  ];

  private readonly DEFAULT_TEXT_STYLES: Record<string, TextStyle> = {
    bold_white: {
      fontFamily: 'Arial Black',
      fontSize: 48,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      shadow: true,
      bold: true,
      italic: false,
      opacity: 1.0
    },
    modern_yellow: {
      fontFamily: 'Helvetica',
      fontSize: 44,
      color: '#FFD700',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#FFD700',
      borderWidth: 2,
      shadow: true,
      bold: true,
      italic: false,
      opacity: 1.0
    },
    clean_blue: {
      fontFamily: 'Arial',
      fontSize: 42,
      color: '#00BFFF',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      shadow: false,
      bold: true,
      italic: false,
      opacity: 1.0
    },
    dramatic_red: {
      fontFamily: 'Impact',
      fontSize: 50,
      color: '#FF4444',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      shadow: true,
      bold: true,
      italic: false,
      opacity: 1.0
    }
  };

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.OUTPUT_DIR, { recursive: true });
      await fs.mkdir(this.FONT_DIR, { recursive: true });
    } catch (error) {
      logger.error('Failed to create directories:', error);
    }
  }

  /**
   * Generate viral hooks for a video
   */
  async generateViralHooks(request: ViralOptimizationRequest): Promise<ViralHook[]> {
    try {
      logger.info(`Generating viral hooks for video ${request.videoId}`);

      // Get relevant templates based on platform and category
      const relevantTemplates = this.getRelevantTemplates(request);
      
      // Generate hooks using templates and AI
      const hooks: ViralHook[] = [];
      const maxHooks = request.maxHooks || 3;

      for (let i = 0; i < Math.min(maxHooks, relevantTemplates.length); i++) {
        const template = relevantTemplates[i];
        if (template) {
          const hook = await this.generateHookFromTemplate(template, request);
          if (hook) {
            hooks.push(hook);
          }
        }
      }

      // Sort by effectiveness
      hooks.sort((a, b) => b.effectiveness - a.effectiveness);

      logger.info(`Generated ${hooks.length} viral hooks for video ${request.videoId}`);
      return hooks;
    } catch (error) {
      logger.error('Failed to generate viral hooks:', error);
      throw error;
    }
  }

  /**
   * Apply viral optimization to video
   */
  async optimizeVideo(request: ViralOptimizationRequest): Promise<ViralOptimizationResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting viral optimization for video ${request.videoId}`);

      // Get video information
      const video = await this.getVideoInfo(request.videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      // Generate viral hooks
      const hooks = await this.generateViralHooks(request);
      
      // Apply hooks to video
      const optimizedVideoPath = await this.applyHooksToVideo(video.filePath, hooks);

      // Calculate overall effectiveness
      const effectiveness = this.calculateOverallEffectiveness(hooks);

      // Generate recommendations
      const recommendations = this.generateRecommendations(hooks, request);

      const processingTime = Date.now() - startTime;

      const result: ViralOptimizationResult = {
        videoId: request.videoId,
        hooks,
        optimizedVideoPath,
        originalVideoPath: video.filePath,
        processingTime,
        effectiveness,
        recommendations
      };

      // Save optimization result to database
      await this.saveOptimizationResult(result);

      logger.info(`Viral optimization completed for video ${request.videoId} in ${processingTime}ms`);
      return result;
    } catch (error) {
      logger.error('Failed to optimize video:', error);
      throw error;
    }
  }

  /**
   * Apply text overlays to video using FFmpeg
   */
  private async applyHooksToVideo(videoPath: string, hooks: ViralHook[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.OUTPUT_DIR, `optimized_${Date.now()}.mp4`);
      
      let command = ffmpeg(videoPath);

      // Build filter complex for text overlays
      const filters: string[] = [];
      // let _inputIndex = 0;

      hooks.forEach((hook, _index) => {
        const style = hook.style;
        const position = this.calculateTextPosition(hook.position);
        
        // Create text overlay filter
        const textFilter = [
          `drawtext=text='${hook.text.replace(/'/g, "\\'")}':`,
          `fontfile=${this.getFontPath(style.fontFamily)}:`,
          `fontsize=${style.fontSize}:`,
          `fontcolor=${style.color}:`,
          `x=${position.x}:y=${position.y}:`,
          `enable='between(t,${hook.timing},${hook.timing + hook.duration})'`
        ].join('');

        if (style.backgroundColor) {
          // Add background box
                     const boxFilter = [
             `drawbox=x=(${position.x})-10:y=(${position.y})-10:`,
             `w=text_w+20:h=text_h+20:`,
             `color=${style.backgroundColor}:`,
             `enable='between(t,${hook.timing},${hook.timing + hook.duration})'`
           ].join('');
          
          filters.push(boxFilter);
        }

        filters.push(textFilter);
      });

      // Apply filters
      if (filters.length > 0) {
        command = command.complexFilter(filters.join(','));
      }

      command
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-movflags +faststart'
        ])
        .on('end', () => {
          logger.info(`Video optimization completed: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          logger.error('Video optimization failed:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Get relevant templates based on request
   */
  private getRelevantTemplates(request: ViralOptimizationRequest): ViralTemplate[] {
    let templates = this.VIRAL_TEMPLATES.filter(template => {
      // Filter by platform
      if (!template.platforms.includes(request.platform)) return false;
      
      // Filter by category
      if (request.videoCategory && template.category !== request.videoCategory) return false;
      
      // Filter by hook types if specified
      if (request.hookTypes && !request.hookTypes.includes(template.hookType)) return false;
      
      return true;
    });

    // Sort by effectiveness
    templates.sort((a, b) => b.effectiveness - a.effectiveness);

    return templates;
  }

  /**
   * Generate hook from template
   */
  private async generateHookFromTemplate(
    template: ViralTemplate, 
    request: ViralOptimizationRequest
  ): Promise<ViralHook | null> {
    try {
      const hookId = `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Select random text from template
      const text = template.textTemplates[Math.floor(Math.random() * template.textTemplates.length)] || 'Default text';
      
      // Determine timing and duration
      const timing = this.calculateOptimalTiming(template.hookType);
      const duration = this.calculateOptimalDuration(template.hookType, text || '');
      
      // Select appropriate style
      const style = this.selectTextStyle(template.hookType, request.platform);
      
      // Calculate position
      const position = this.calculateOptimalPosition(template.hookType);
      
      // Select animation
      const animation = this.selectAnimation(template.hookType);

      const hook: ViralHook = {
        id: hookId,
        type: template.hookType,
        text: text || '',
        timing,
        duration,
        position,
        style,
        animation,
        category: template.category,
        effectiveness: template.effectiveness,
        platform: [request.platform]
      };

      return hook;
    } catch (error) {
      logger.error('Failed to generate hook from template:', error);
      return null;
    }
  }

  /**
   * Calculate optimal timing for hook type
   */
  private calculateOptimalTiming(hookType: HookType): number {
    const timingMap: Record<HookType, number> = {
      question: 0.5,
      controversy: 0.3,
      curiosity: 0.2,
      emotion: 0.8,
      shock: 0.1,
      trend: 0.4,
      challenge: 0.6,
      countdown: 0.0,
      transformation: 0.5,
      reveal: 1.0
    };

    return timingMap[hookType] || 0.5;
  }

  /**
   * Calculate optimal duration for hook
   */
  private calculateOptimalDuration(hookType: HookType, text: string): number {
    const baseTime = text.length * 0.1; // ~0.1 seconds per character
    const minTime = 1.5;
    const maxTime = 3.0;

    const adjustedTime = Math.max(minTime, Math.min(maxTime, baseTime));
    
    // Adjust based on hook type
    const multipliers: Record<HookType, number> = {
      question: 1.2,
      controversy: 1.0,
      curiosity: 1.1,
      emotion: 1.3,
      shock: 0.8,
      trend: 1.0,
      challenge: 1.1,
      countdown: 0.7,
      transformation: 1.0,
      reveal: 1.2
    };

    return adjustedTime * (multipliers[hookType] || 1.0);
  }

  /**
   * Select appropriate text style
   */
  private selectTextStyle(hookType: HookType, _platform: string): TextStyle {
    const styleMap: Record<HookType, string> = {
      question: 'bold_white',
      controversy: 'dramatic_red',
      curiosity: 'modern_yellow',
      emotion: 'clean_blue',
      shock: 'dramatic_red',
      trend: 'modern_yellow',
      challenge: 'bold_white',
      countdown: 'dramatic_red',
      transformation: 'modern_yellow',
      reveal: 'bold_white'
    };

             const styleName = styleMap[hookType] || 'bold_white';
    const baseStyle = this.DEFAULT_TEXT_STYLES[styleName];
    if (!baseStyle) {
      // Fallback to a default style if none found
      return {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#FFFFFF',
        shadow: true,
        bold: true,
        italic: false,
        opacity: 1.0
      };
    }
    return { ...baseStyle };
  }

  /**
   * Calculate optimal position for hook
   */
  private calculateOptimalPosition(hookType: HookType): TextPosition {
    const positionMap: Record<HookType, TextPosition> = {
      question: { x: 50, y: 20, anchor: 'top-center' },
      controversy: { x: 50, y: 15, anchor: 'top-center' },
      curiosity: { x: 50, y: 25, anchor: 'top-center' },
      emotion: { x: 50, y: 80, anchor: 'bottom-center' },
      shock: { x: 50, y: 10, anchor: 'top-center' },
      trend: { x: 50, y: 20, anchor: 'top-center' },
      challenge: { x: 50, y: 20, anchor: 'top-center' },
      countdown: { x: 50, y: 15, anchor: 'top-center' },
      transformation: { x: 50, y: 20, anchor: 'top-center' },
      reveal: { x: 50, y: 85, anchor: 'bottom-center' }
    };

    return positionMap[hookType] || { x: 50, y: 20, anchor: 'top-center' };
  }

  /**
   * Select animation type
   */
  private selectAnimation(hookType: HookType): AnimationType {
    const animationMap: Record<HookType, AnimationType> = {
      question: 'fade-in',
      controversy: 'shake',
      curiosity: 'zoom-in',
      emotion: 'fade-in',
      shock: 'bounce',
      trend: 'slide-up',
      challenge: 'pulse',
      countdown: 'typewriter',
      transformation: 'slide-left',
      reveal: 'zoom-out'
    };

    return animationMap[hookType] || 'fade-in';
  }

  /**
   * Calculate text position coordinates
   */
  private calculateTextPosition(position: TextPosition): { x: string; y: string } {
    const x = `(w-text_w)*${position.x / 100}`;
    const y = `(h-text_h)*${position.y / 100}`;
    
    return { x, y };
  }

  /**
   * Get font path for font family
   */
  private getFontPath(fontFamily: string): string {
    const fontMap: Record<string, string> = {
      'Arial': path.join(this.FONT_DIR, 'arial.ttf'),
      'Arial Black': path.join(this.FONT_DIR, 'arial-black.ttf'),
      'Helvetica': path.join(this.FONT_DIR, 'helvetica.ttf'),
      'Impact': path.join(this.FONT_DIR, 'impact.ttf')
    };

    return fontMap[fontFamily] || fontMap['Arial'] || path.join(this.FONT_DIR, 'arial.ttf');
  }

  /**
   * Get video information from database
   */
  private async getVideoInfo(videoId: string): Promise<any> {
    try {
      const video = await Video.findById(videoId);
      return video ? video.toObject() : null;
    } catch (error) {
      logger.error('Failed to get video info:', error);
      return null;
    }
  }

  /**
   * Calculate overall effectiveness
   */
  private calculateOverallEffectiveness(hooks: ViralHook[]): number {
    if (hooks.length === 0) return 0;
    
    const totalEffectiveness = hooks.reduce((sum, hook) => sum + hook.effectiveness, 0);
    return totalEffectiveness / hooks.length;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(hooks: ViralHook[], request: ViralOptimizationRequest): string[] {
    const recommendations: string[] = [];

    if (hooks.length === 0) {
      recommendations.push('No viral hooks were generated. Consider using more engaging content.');
      return recommendations;
    }

    const avgEffectiveness = this.calculateOverallEffectiveness(hooks);
    
    if (avgEffectiveness < 0.6) {
      recommendations.push('Consider using more engaging hook types like questions or transformations.');
    }

    if (avgEffectiveness > 0.8) {
      recommendations.push('Excellent hook selection! These should perform very well.');
    }

    const hookTypes = hooks.map(h => h.type);
    if (!hookTypes.includes('question')) {
      recommendations.push('Consider adding a question hook to increase engagement.');
    }

    if (request.platform === 'tiktok' && !hookTypes.includes('trend')) {
      recommendations.push('For TikTok, consider adding trend-based hooks.');
    }

    if (hooks.some(h => h.timing > 1.5)) {
      recommendations.push('Consider moving hooks earlier in the video for better retention.');
    }

    return recommendations;
  }

  /**
   * Save optimization result to database
   */
  private async saveOptimizationResult(result: ViralOptimizationResult): Promise<void> {
    try {
      const optimization = new ViralOptimization({
        videoId: result.videoId,
        hooks: result.hooks,
        optimizedVideoPath: result.optimizedVideoPath,
        originalVideoPath: result.originalVideoPath,
        processingTime: result.processingTime,
        effectiveness: result.effectiveness,
        recommendations: result.recommendations
      });

      await optimization.save();
    } catch (error) {
      logger.error('Failed to save optimization result:', error);
      throw error;
    }
  }

  /**
   * Get optimization history for user
   */
  async getOptimizationHistory(userId: string, limit: number = 10): Promise<ViralOptimizationResult[]> {
    try {
      // First get videos for this user
      const userVideos = await Video.find({ userId }).select('_id');
      const videoIds = userVideos.map(v => v._id.toString());

      // Then get optimization history for those videos
      const optimizations = await ViralOptimization.find({ 
        videoId: { $in: videoIds } 
      })
      .sort({ createdAt: -1 })
      .limit(limit);

      return optimizations.map(opt => ({
        videoId: opt.videoId,
        hooks: opt.hooks as ViralHook[],
        optimizedVideoPath: opt.optimizedVideoPath,
        originalVideoPath: opt.originalVideoPath,
        processingTime: opt.processingTime,
        effectiveness: opt.effectiveness,
        recommendations: opt.recommendations
      }));
    } catch (error) {
      logger.error('Failed to get optimization history:', error);
      throw error;
    }
  }

  /**
   * Get viral templates
   */
  getViralTemplates(): ViralTemplate[] {
    return this.VIRAL_TEMPLATES;
  }
}

export const viralOptimizationService = new ViralOptimizationService();
export default viralOptimizationService; 