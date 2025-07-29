import PostInsight from '../models/PostInsights';
import TopHashtag from '../models/TopHashtags';
import { VideoStatus } from '../models/VideoStatus';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface RepostCandidate {
  videoId: string;
  platform: 'youtube' | 'instagram';
  performanceScore: number;
  originalCaption: string;
  hashtags: string[];
  title?: string;
  views: number;
  likes: number;
  originalPostDate: Date;
  _id: string;
}

interface RepostPlan {
  candidate: RepostCandidate;
  newCaption: string;
  newHashtags: string[];
  scheduledTime?: Date;
}

export class SmartRepostService {
  private newUploadThreshold: number = 20; // PHASE 2: Wait for 20 new uploads

  /**
   * Check if we should trigger reposting based on new upload count - PHASE 2 ENHANCED
   */
  async shouldTriggerRepost(): Promise<boolean> {
    try {
      // Get last repost trigger date from settings
      const lastRepostDate = await this.getLastRepostTriggerDate();
      
      // Count new uploads since last repost trigger from VideoStatus
      const recentUploads = await VideoStatus.countDocuments({
        status: { $in: ['ready', 'posted'] },
        uploadDate: { $gte: lastRepostDate }
      });

      console.log(`📊 Found ${recentUploads} new uploads since last repost trigger (${lastRepostDate})`);
      console.log(`🎯 Threshold: ${this.newUploadThreshold} uploads needed to trigger repost`);
      
      const shouldTrigger = recentUploads >= this.newUploadThreshold;
      console.log(`🔄 Should trigger repost: ${shouldTrigger}`);
      
      return shouldTrigger;
    } catch (error) {
      console.error('❌ Error checking repost trigger:', error);
      return false;
    }
  }

  /**
   * Get the date of the last repost trigger from settings - PHASE 2 ENHANCED
   */
  private async getLastRepostTriggerDate(): Promise<Date> {
    try {
      const settingsPath = path.join(process.cwd(), 'backend', 'settings.json');
      
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.lastRepostTriggerDate) {
          return new Date(settings.lastRepostTriggerDate);
        }
      }
      
      // Default: 30 days ago for first run
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return thirtyDaysAgo;
    } catch (error) {
      console.warn('Could not read last repost date from settings, using 30 days ago');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return thirtyDaysAgo;
    }
  }

  /**
   * Update the last repost trigger date in settings - PHASE 2 ENHANCED
   */
  private async updateLastRepostTriggerDate(): Promise<void> {
    try {
      const settingsPath = path.join(process.cwd(), 'backend', 'settings.json');
      let settings: any = {};

      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      }

      settings.lastRepostTriggerDate = new Date().toISOString();
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      
      console.log('✅ Updated last repost trigger date in settings');
    } catch (error) {
      console.error('❌ Error updating last repost trigger date:', error);
    }
  }

  /**
   * Get 1-3 top performing videos eligible for reposting - PHASE 2 ENHANCED
   */
  async getRepostCandidates(count: number = 3): Promise<RepostCandidate[]> {
    try {
      // Get repost cooldown days from settings (minimum days between posts)
      const cooldownDays = await this.getRepostCooldownDays();
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);

      console.log(`🔍 Looking for repost candidates with ${cooldownDays} day cooldown`);

      // Find eligible videos from PostInsights that haven't been reposted
      const candidates = await PostInsight.find({
        repostEligible: true,
        reposted: false,
        performanceScore: { $gte: 70 }, // PHASE 2: Minimum performance threshold
        originalPostDate: { $lt: cooldownDate } // Respect cooldown period
      })
      .sort({ performanceScore: -1 })
      .limit(count * 2) // Get more candidates to filter from
      .lean();

      console.log(`📋 Found ${candidates.length} potential repost candidates`);

      // Convert to RepostCandidate format
      const repostCandidates: RepostCandidate[] = candidates.map(video => ({
        _id: video._id.toString(),
        videoId: video.videoId,
        platform: video.platform,
        performanceScore: video.performanceScore,
        originalCaption: video.caption,
        hashtags: video.hashtags,
        title: video.title,
        views: video.views || 0,
        likes: video.likes || 0,
        originalPostDate: video.originalPostDate
      }));

      // Return top candidates up to requested count
      const finalCandidates = repostCandidates.slice(0, count);
      
      console.log(`✅ Selected ${finalCandidates.length} candidates for reposting`);
      return finalCandidates;
    } catch (error) {
      console.error('❌ Error getting repost candidates:', error);
      throw error;
    }
  }

  /**
   * Get repost cooldown days from settings (defaults to 20) - PHASE 2 ENHANCED
   */
  private async getRepostCooldownDays(): Promise<number> {
    try {
      const settingsPath = path.join(process.cwd(), 'backend', 'settings.json');
      
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        return settings.minDaysBetweenPosts || 20; // Use existing setting from Phase 1
      }
      
      return 20; // Default cooldown
    } catch (error) {
      console.warn('Could not read repost cooldown from settings, using default of 20 days');
      return 20;
    }
  }

  /**
   * Get top performing hashtags for repost caption generation - PHASE 2 ENHANCED
   */
  async getTopHashtags(platform?: 'youtube' | 'instagram', limit: number = 20): Promise<string[]> {
    try {
      const query = platform ? { platform } : {};
      
      const topHashtags = await TopHashtag.find(query)
        .sort({ avgViewScore: -1, usageCount: -1 })
        .limit(limit) // PHASE 2: Get top 20 hashtags
        .select('hashtag')
        .lean();

      const hashtags = topHashtags.map(h => h.hashtag);
      console.log(`📊 Retrieved ${hashtags.length} top hashtags for ${platform || 'all platforms'}`);
      
      return hashtags;
    } catch (error) {
      console.error('❌ Error fetching top hashtags:', error);
      return [];
    }
  }

  /**
   * Generate new caption with GPT and fresh hooks + top hashtags - PHASE 2 ENHANCED
   */
  async generateNewCaption(candidate: RepostCandidate): Promise<string> {
    try {
      console.log(`🎨 Generating new caption for ${candidate.platform} video: ${candidate.videoId}`);
      
      // Get OpenAI API key from settings
      const openaiApiKey = await this.getOpenAIApiKey();
      
      if (openaiApiKey) {
        // Try GPT caption generation
        try {
          const gptCaption = await this.generateGPTCaption(candidate, openaiApiKey);
          if (gptCaption) {
            console.log('✅ Generated caption using GPT');
            return gptCaption;
          }
        } catch (gptError) {
          console.warn('⚠️ GPT caption generation failed, falling back to template approach');
        }
      } else {
        console.warn('⚠️ No OpenAI API key found, using template-based caption generation');
      }
      
      // Fallback: Use template-based approach
      const templateCaption = await this.generateTemplateCaption(candidate);
      console.log('✅ Generated caption using template approach');
      return templateCaption;
    } catch (error) {
      console.error('❌ Error generating new caption:', error);
      // Final fallback: original caption with new hashtags
      return await this.generateFallbackCaption(candidate);
    }
  }

  /**
   * Generate caption using GPT with fresh hooks and top hashtags - PHASE 2 NEW
   */
  private async generateGPTCaption(candidate: RepostCandidate, apiKey: string): Promise<string | null> {
    try {
      const topHashtags = await this.getTopHashtags(candidate.platform, 15);
      const originalContent = this.extractContentWithoutHashtags(candidate.originalCaption);
      
      const prompt = `Create a fresh, engaging social media caption for a repost on ${candidate.platform}.
      
Original content: "${originalContent}"
Performance score: ${candidate.performanceScore}
Views: ${candidate.views}, Likes: ${candidate.likes}

Requirements:
- Create a completely new hook that's engaging and different from the original
- Keep the core message and value proposition
- Make it feel fresh, not like a repost
- Use an engaging, conversational tone
- Platform: ${candidate.platform}
- Target audience: Real estate professionals and potential homebuyers
- Include 3-5 relevant emojis
- End with a clear call to action

DO NOT include hashtags in your response - they will be added separately.

Generate a captivating caption:`;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert social media content creator specializing in real estate content. Create engaging, professional captions that drive engagement.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const gptCaption = response.data.choices[0]?.message?.content?.trim();
      
      if (gptCaption) {
        // Add top hashtags to GPT-generated caption
        const hashtagString = topHashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
        return `${gptCaption}\n\n${hashtagString}`;
      }
      
      return null;
    } catch (error) {
      console.error('❌ GPT caption generation error:', error);
      return null;
    }
  }

  /**
   * Generate caption using template approach - PHASE 2 ENHANCED
   */
  private async generateTemplateCaption(candidate: RepostCandidate): Promise<string> {
    const topHashtags = await this.getTopHashtags(candidate.platform, 15);
    const originalContent = this.extractContentWithoutHashtags(candidate.originalCaption);
    
    // Generate new hook variations
    const hooks = this.generateHookVariations(originalContent, candidate.platform);
    const selectedHook = hooks[Math.floor(Math.random() * hooks.length)];
    
    // Combine with top hashtags
    const hashtagString = topHashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
    
    return `${selectedHook}\n\n${hashtagString}`;
  }

  /**
   * Generate fallback caption - PHASE 2 ENHANCED
   */
  private async generateFallbackCaption(candidate: RepostCandidate): Promise<string> {
    const topHashtags = await this.getTopHashtags(candidate.platform, 10);
    const originalContent = this.extractContentWithoutHashtags(candidate.originalCaption);
    const hashtagString = topHashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
    
    return `${originalContent}\n\n${hashtagString}`;
  }

  /**
   * Get OpenAI API key from settings - PHASE 2 NEW
   */
  private async getOpenAIApiKey(): Promise<string | null> {
    try {
      const settingsPath = path.join(process.cwd(), 'backend', 'settings.json');
      
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        return settings.openaiApiKey || null;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting OpenAI API key:', error);
      return null;
    }
  }

  /**
   * Extract content without hashtags from original caption - PHASE 2 ENHANCED
   */
  private extractContentWithoutHashtags(caption: string): string {
    // Remove hashtags and clean up
    const withoutHashtags = caption.replace(/#[a-zA-Z0-9_]+/g, '').trim();
    
    // Remove extra whitespace and newlines
    const cleaned = withoutHashtags.replace(/\s+/g, ' ').trim();
    
    return cleaned || 'Check out this amazing content!';
  }

  /**
   * Generate hook variations for repost captions - PHASE 2 ENHANCED
   */
  private generateHookVariations(originalContent: string, platform: 'youtube' | 'instagram'): string[] {
    const platformEmojis = platform === 'instagram' ? ['📸', '✨', '💎'] : ['🎥', '📺', '🚀'];
    const emoji = platformEmojis[Math.floor(Math.random() * platformEmojis.length)];
    
    const hooks = [
      `${emoji} This one's still fire! ${originalContent}`,
      `✨ Had to share this gem again! ${originalContent}`,
      `💎 This content hits different every time! ${originalContent}`,
      `🚀 Still one of our favorites! ${originalContent}`,
      `🎯 This never gets old! ${originalContent}`,
      `⚡ Bringing this back by popular demand! ${originalContent}`,
      `🌟 This content deserves another spotlight! ${originalContent}`,
      `💥 Can't get enough of this! ${originalContent}`,
      `🔄 Throwback to this amazing moment! ${originalContent}`,
      `✅ Still relevant, still amazing! ${originalContent}`,
      `🔥 Worth resharing! ${originalContent}`,
      `💡 This insight bears repeating! ${originalContent}`,
      `🏆 One of our top performers! ${originalContent}`,
      `📢 Sharing this again for those who missed it! ${originalContent}`,
      `⭐ This content aged like fine wine! ${originalContent}`
    ];

    return hooks;
  }

  /**
   * Create repost plans for candidates - PHASE 2 ENHANCED
   */
  async createRepostPlans(candidates: RepostCandidate[]): Promise<RepostPlan[]> {
    try {
      const plans: RepostPlan[] = [];
      
      for (const candidate of candidates) {
        const newCaption = await this.generateNewCaption(candidate);
        const newHashtags = await this.getTopHashtags(candidate.platform, 15);
        
        // Schedule for optimal posting time (integrate with peak hours when available)
        const scheduledTime = this.getNextOptimalPostTime();
        
        plans.push({
          candidate,
          newCaption,
          newHashtags,
          scheduledTime
        });
      }

      console.log(`✅ Created ${plans.length} repost plans`);
      return plans;
    } catch (error) {
      console.error('❌ Error creating repost plans:', error);
      throw error;
    }
  }

  /**
   * Get next optimal posting time - PHASE 2 ENHANCED
   */
  private getNextOptimalPostTime(): Date {
    // Schedule for optimal times based on platform best practices
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Real estate content performs well at 2 PM on weekdays
    if (tomorrow.getDay() >= 1 && tomorrow.getDay() <= 5) { // Monday-Friday
      tomorrow.setHours(14, 0, 0, 0); // 2 PM
    } else {
      tomorrow.setHours(10, 0, 0, 0); // 10 AM on weekends
    }
    
    return tomorrow;
  }

  /**
   * Schedule reposts in VideoStatus queue - PHASE 2 ENHANCED
   */
  async scheduleReposts(plans: RepostPlan[]): Promise<void> {
    try {
      for (const plan of plans) {
        // Create new VideoStatus entry for repost
        await VideoStatus.create({
          videoId: `repost_${plan.candidate.videoId}_${Date.now()}`,
          platform: plan.candidate.platform,
          captionGenerated: true,
          status: 'ready',
          fingerprint: {
            hash: `repost_${plan.candidate.videoId}`,
            size: 0,
            duration: 0
          },
          filename: `repost_${plan.candidate.videoId}`,
          filePath: null, // Repost uses original video
          uploadDate: plan.scheduledTime || new Date(),
          repostData: {
            originalVideoId: plan.candidate.videoId,
            originalCaption: plan.candidate.originalCaption,
            newCaption: plan.newCaption,
            isRepost: true,
            performanceScore: plan.candidate.performanceScore
          }
        });

        // Mark original as reposted in PostInsights
        await PostInsight.findByIdAndUpdate(plan.candidate._id, {
          reposted: true,
          repostedAt: new Date()
        });

        console.log(`📅 Scheduled repost for ${plan.candidate.platform} video: ${plan.candidate.videoId}`);
      }

      console.log(`✅ Scheduled ${plans.length} reposts in VideoStatus queue`);
    } catch (error) {
      console.error('❌ Error scheduling reposts:', error);
      throw error;
    }
  }

  /**
   * Full smart repost process - PHASE 2 ENHANCED
   */
  async performSmartRepost(): Promise<{
    triggered: boolean;
    candidatesFound: number;
    repostsScheduled: number;
    threshold: number;
    newUploads: number;
  }> {
    try {
      console.log('🚀 Starting Phase 2 smart repost process...');
      
      // 1. Check if we should trigger reposting
      const shouldTrigger = await this.shouldTriggerRepost();
      
      // Get current upload count for reporting
      const lastRepostDate = await this.getLastRepostTriggerDate();
      const newUploads = await VideoStatus.countDocuments({
        status: { $in: ['ready', 'posted'] },
        uploadDate: { $gte: lastRepostDate }
      });
      
      if (!shouldTrigger) {
        console.log(`📊 Repost threshold not met: ${newUploads}/${this.newUploadThreshold} uploads`);
        return {
          triggered: false,
          candidatesFound: 0,
          repostsScheduled: 0,
          threshold: this.newUploadThreshold,
          newUploads
        };
      }

      console.log(`🎯 Repost threshold reached! Processing ${newUploads} new uploads...`);

      // 2. Get repost candidates (1-3 based on performance)
      const maxReposts = this.calculateMaxReposts(newUploads);
      const candidates = await this.getRepostCandidates(maxReposts);
      
      if (candidates.length === 0) {
        console.log('⚠️ No eligible repost candidates found');
        await this.updateLastRepostTriggerDate(); // Update trigger date anyway
        return {
          triggered: true,
          candidatesFound: 0,
          repostsScheduled: 0,
          threshold: this.newUploadThreshold,
          newUploads
        };
      }

      // 3. Create repost plans with new captions and hashtags
      const plans = await this.createRepostPlans(candidates);
      
      // 4. Schedule reposts in VideoStatus queue
      await this.scheduleReposts(plans);
      
      // 5. Update last repost trigger date
      await this.updateLastRepostTriggerDate();
      
      console.log(`✅ Phase 2 smart repost process completed: ${plans.length} reposts scheduled`);
      
      return {
        triggered: true,
        candidatesFound: candidates.length,
        repostsScheduled: plans.length,
        threshold: this.newUploadThreshold,
        newUploads
      };
    } catch (error) {
      console.error('❌ Error in Phase 2 smart repost process:', error);
      throw error;
    }
  }

  /**
   * Calculate maximum reposts based on new upload volume - PHASE 2 NEW
   */
  private calculateMaxReposts(newUploads: number): number {
    // Scale reposts based on volume: 20-39 uploads = 1 repost, 40-59 = 2 reposts, 60+ = 3 reposts
    if (newUploads >= 60) return 3;
    if (newUploads >= 40) return 2;
    return 1;
  }

  /**
   * Get smart repost analytics - PHASE 2 NEW
   */
  async getRepostAnalytics(): Promise<{
    summary: {
      totalReposted: number;
      pendingReposts: number;
      repostPerformance: any;
    };
    upcomingReposts: any[];
    recentActivity: any[];
  }> {
    try {
      // Get repost statistics
      const [totalReposted, pendingReposts, recentActivity] = await Promise.all([
        PostInsight.countDocuments({ reposted: true }),
        VideoStatus.countDocuments({ 'repostData.isRepost': true, status: 'ready' }),
        PostInsight.find({ reposted: true })
          .sort({ repostedAt: -1 })
          .limit(10)
          .select('platform videoId performanceScore repostedAt originalPostDate')
          .lean()
      ]);

      // Get upcoming scheduled reposts
      const upcomingReposts = await VideoStatus.find({
        'repostData.isRepost': true,
        status: 'ready'
      })
      .sort({ uploadDate: 1 })
      .limit(10)
      .lean();

      // Calculate repost performance
      const repostPerformance = await PostInsight.aggregate([
        { $match: { reposted: true } },
        {
          $group: {
            _id: '$platform',
            avgPerformanceScore: { $avg: '$performanceScore' },
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        summary: {
          totalReposted,
          pendingReposts,
          repostPerformance: repostPerformance.reduce((acc: any, item: any) => {
            acc[item._id] = {
              avgScore: Math.round(item.avgPerformanceScore),
              count: item.count
            };
            return acc;
          }, {})
        },
        upcomingReposts: upcomingReposts.map(repost => ({
          videoId: repost.videoId,
          platform: repost.platform,
          scheduledTime: repost.uploadDate,
          originalVideoId: repost.repostData?.originalVideoId
        })),
        recentActivity: recentActivity.map((activity: any) => ({
          platform: activity.platform,
          videoId: activity.videoId,
          performanceScore: activity.performanceScore,
          originalDate: activity.originalPostDate,
          repostedAt: activity.repostedAt
        }))
      };
    } catch (error) {
      console.error('❌ Error getting repost analytics:', error);
      throw error;
    }
  }

  /**
   * Manual repost trigger for specific platform - PHASE 2 NEW
   */
  async triggerManualRepost(platform?: 'youtube' | 'instagram', count: number = 1): Promise<{
    success: boolean;
    candidatesFound: number;
    repostsScheduled: number;
    message: string;
  }> {
    try {
      console.log(`🔧 Manual repost trigger for ${platform || 'all platforms'}, count: ${count}`);
      
      // Get candidates filtered by platform if specified
      let candidates = await this.getRepostCandidates(count * 2); // Get more to filter
      
      if (platform) {
        candidates = candidates.filter(c => c.platform === platform);
      }
      
      candidates = candidates.slice(0, count); // Limit to requested count
      
      if (candidates.length === 0) {
        return {
          success: false,
          candidatesFound: 0,
          repostsScheduled: 0,
          message: `No eligible repost candidates found for ${platform || 'any platform'}`
        };
      }

      // Create and schedule reposts
      const plans = await this.createRepostPlans(candidates);
      await this.scheduleReposts(plans);
      
      return {
        success: true,
        candidatesFound: candidates.length,
        repostsScheduled: plans.length,
        message: `Successfully scheduled ${plans.length} manual reposts`
      };
    } catch (error) {
      console.error('❌ Error in manual repost trigger:', error);
      return {
        success: false,
        candidatesFound: 0,
        repostsScheduled: 0,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 