import { trendingAudioService } from '../services/trendingAudioService';

/**
 * Get trending audio for platform
 */
export const getTrendingAudio = async (platform: 'instagram' | 'youtube'): Promise<string | null> => {
  try {
    const audioId = await trendingAudioService.getRandomTrendingAudio(platform);
    console.log(`🎵 Selected trending audio for ${platform}: ${audioId || 'none'}`);
    return audioId;
  } catch (error) {
    console.error(`❌ Failed to get trending audio for ${platform}:`, error);
    return null;
  }
};