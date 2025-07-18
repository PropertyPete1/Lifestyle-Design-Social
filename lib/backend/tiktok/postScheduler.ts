import { getOptimalPostingTimes } from '../utils/postingTimes'
import { uploadTikTokVideo } from './publish'
import { VideoWithCaption } from '@/types/video'
import { getNextCartoonToggle } from '../utils/cartoonToggle'

export async function autoScheduleTikTokPost(video: VideoWithCaption) {
  const { shouldUseCartoon } = await getNextCartoonToggle()

  const scheduledTime = await getOptimalPostingTimes('tiktok')
  const result = await uploadTikTokVideo(video, scheduledTime)

  return {
    platform: 'tiktok',
    scheduledTime,
    isCartoon: shouldUseCartoon,
    videoId: result.videoId,
  }
} 