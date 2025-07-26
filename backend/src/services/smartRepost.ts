import PostInsight from '../models/PostInsights';
import TopHashtag from '../models/TopHashtags';
import { VideoQueue } from './videoQueue';

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
}

interface RepostPlan {
  candidate: RepostCandidate;
  newCaption: string;
  newHashtags: string[];
  scheduledTime?: Date;
}

export class SmartRepostService {
  private newUploadThreshold: number = 20;

  /**
   * Check if we should trigger reposting based on new upload count
   */
  async shouldTriggerRepost(): Promise<boolean> {
    try {
      // Count new uploads since last repost trigger
      const recentUploads = await VideoQueue.countDocuments({
        status: { $in: ['pending', 'posted'] },
        createdAt: { $gte: this.getLastRepostDate() }
      });

      console.log(`Found ${recentUploads} new uploads since last repost trigger`);
      return recentUploads >= this.newUploadThreshold;
    } catch (error) {
      console.error('Error checking repost trigger:', error);
      return false;
    }
  }

  /**
   * Get the date of the last repost trigger (or 30 days ago if none)
   */
  private getLastRepostDate(): Date {
    // For now, use 30 days ago as baseline
    // In production, this could be stored in a settings collection
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo;
  }

  /**
   * Get 1-3 top performing videos eligible for reposting
   */
  async getRepostCandidates(count: number = 3): Promise<RepostCandidate[]> {
    try {
      // Find eligible videos that haven't been reposted recently
      const candidates = await PostInsight.find({
        repostEligible: true,
        reposted: false,
        performanceScore: { $gt: 1000 } // Minimum performance threshold
      })
      .sort({ performanceScore: -1 })
      .limit(count * 2) // Get more candidates to filter from
      .lean();

      // Convert to RepostCandidate format
      const repostCandidates: RepostCandidate[] = candidates.map(video => ({
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

      // Filter out videos that were posted too recently (within repost cooldown)
      const cooldownDays = await this.getRepostCooldownDays();
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);

      const eligibleCandidates = repostCandidates.filter(candidate => 
        candidate.originalPostDate < cooldownDate
      );

      // Return top candidates up to requested count
      const finalCandidates = eligibleCandidates.slice(0, count);
      
      console.log(`Selected ${finalCandidates.length} candidates for reposting`);
      return finalCandidates;
    } catch (error) {
      console.error('Error getting repost candidates:', error);
      throw error;
    }
  }

  /**
   * Get repost cooldown days from settings (defaults to 20)
   */
  private async getRepostCooldownDays(): Promise<number> {
    try {
      // Read from settings file or database
      const fs = require('fs').promises;
      const path = require('path');
      const settingsPath = path.join(process.cwd(), 'backend', 'settings.json');
      
      const settingsData = await fs.readFile(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      
      return settings.repostCooldownDays || 20;
    } catch (error) {
      console.warn('Could not read repost cooldown from settings, using default of 20 days');
      return 20;
    }
  }

  /**
   * Get top 10 performing hashtags for repost caption generation
   */
  async getTopHashtags(platform?: 'youtube' | 'instagram'): Promise<string[]> {
    try {
      const query = platform ? { platform } : {};
      
      const topHashtags = await TopHashtag.find(query)
        .sort({ avgViewScore: -1, usageCount: -1 })
        .limit(10)
        .select('hashtag')
        .lean();

      return topHashtags.map(h => h.hashtag);
    } catch (error) {
      console.error('Error fetching top hashtags:', error);
      return [];
    }
  }

  /**
   * Generate new caption with fresh hook and top hashtags
   */
  async generateNewCaption(candidate: RepostCandidate): Promise<string> {
    try {
      const topHashtags = await this.getTopHashtags(candidate.platform);
      
      // Extract core content from original caption (remove old hashtags)
      const originalContent = this.extractContentWithoutHashtags(candidate.originalCaption);
      
      // Generate new hook variations
      const hooks = this.generateHookVariations(originalContent);
      const selectedHook = hooks[Math.floor(Math.random() * hooks.length)];
      
      // Combine with top hashtags
      const hashtagString = topHashtags.join(' ');
      
      const newCaption = `${selectedHook}\n\n${hashtagString}`;
      
      console.log(`Generated new caption for video ${candidate.videoId}`);
      return newCaption;
    } catch (error) {
      console.error('Error generating new caption:', error);
      // Fallback to original caption with new hashtags
      const topHashtags = await this.getTopHashtags(candidate.platform);
      const originalContent = this.extractContentWithoutHashtags(candidate.originalCaption);
      return `${originalContent}\n\n${topHashtags.join(' ')}`;
    }
  }

  /**
   * Extract content without hashtags from original caption
   */
  private extractContentWithoutHashtags(caption: string): string {
    // Remove hashtags and clean up
    const withoutHashtags = caption.replace(/#[a-zA-Z0-9_]+/g, '').trim();
    
    // Remove extra whitespace and newlines
    const cleaned = withoutHashtags.replace(/\s+/g, ' ').trim();
    
    return cleaned || 'Check out this amazing content!';
  }

  /**
   * Generate hook variations for repost captions
   */
  private generateHookVariations(originalContent: string): string[] {
    const hooks = [
      `🔥 This one's still fire! ${originalContent}`,
      `✨ Had to share this gem again! ${originalContent}`,
      `💎 This content hits different every time! ${originalContent}`,
      `🚀 Still one of our favorites! ${originalContent}`,
      `🎯 This never gets old! ${originalContent}`,
      `⚡ Bringing this back by popular demand! ${originalContent}`,
      `🌟 This content deserves another spotlight! ${originalContent}`,
      `💥 Can't get enough of this! ${originalContent}`,
      `🔄 Throwback to this amazing moment! ${originalContent}`,
      `✅ Still relevant, still amazing! ${originalContent}`
    ];

    return hooks;
  }

  /**
   * Create repost plans for candidates
   */
  async createRepostPlans(candidates: RepostCandidate[]): Promise<RepostPlan[]> {
    try {
      const plans: RepostPlan[] = [];
      
      for (const candidate of candidates) {
        const newCaption = await this.generateNewCaption(candidate);
        const newHashtags = await this.getTopHashtags(candidate.platform);
        
        // TODO: Integration with peak hours service for optimal scheduling
        // For now, schedule for next available optimal time
        const scheduledTime = this.getNextOptimalPostTime();
        
        plans.push({
          candidate,
          newCaption,
          newHashtags,
          scheduledTime
        });
      }

      console.log(`Created ${plans.length} repost plans`);
      return plans;
    } catch (error) {
      console.error('Error creating repost plans:', error);
      throw error;
    }
  }

  /**
   * Get next optimal posting time (placeholder for Phase 6 integration)
   */
  private getNextOptimalPostTime(): Date {
    // Placeholder: schedule for tomorrow at 2 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Schedule reposts in video queue
   */
  async scheduleReposts(plans: RepostPlan[]): Promise<void> {
    try {
      for (const plan of plans) {
        // Create new queue entry for repost
        await VideoQueue.create({
          filePath: `repost_${plan.candidate.videoId}`,
          fileSize: 0, // Repost, no new file
          originalName: `Repost: ${plan.candidate.title || plan.candidate.videoId}`,
          status: 'pending',
          platform: plan.candidate.platform,
          caption: plan.newCaption,
          hashtags: plan.newHashtags,
          scheduledTime: plan.scheduledTime,
          isRepost: true,
          originalVideoId: plan.candidate.videoId,
          createdAt: new Date()
        });

        // Mark original as reposted
        await PostInsight.findOneAndUpdate(
          { videoId: plan.candidate.videoId },
          { reposted: true }
        );
      }

      console.log(`Scheduled ${plans.length} reposts in video queue`);
    } catch (error) {
      console.error('Error scheduling reposts:', error);
      throw error;
    }
  }

  /**
   * Full smart repost process
   */
  async performSmartRepost(): Promise<{
    triggered: boolean;
    candidatesFound: number;
    repostsScheduled: number;
  }> {
    try {
      console.log('Starting smart repost process...');
      
      // 1. Check if we should trigger reposting
      const shouldTrigger = await this.shouldTriggerRepost();
      
      if (!shouldTrigger) {
        console.log('Repost threshold not met, skipping repost process');
        return {
          triggered: false,
          candidatesFound: 0,
          repostsScheduled: 0
        };
      }

      // 2. Get repost candidates
      const candidates = await this.getRepostCandidates(3);
      
      if (candidates.length === 0) {
        console.log('No eligible repost candidates found');
        return {
          triggered: true,
          candidatesFound: 0,
          repostsScheduled: 0
        };
      }

      // 3. Create repost plans
      const plans = await this.createRepostPlans(candidates);
      
      // 4. Schedule reposts
      await this.scheduleReposts(plans);
      
      console.log('Smart repost process completed successfully');
      
      return {
        triggered: true,
        candidatesFound: candidates.length,
        repostsScheduled: plans.length
      };
    } catch (error) {
      console.error('Error in smart repost process:', error);
      throw error;
    }
  }
} 