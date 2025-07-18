import { getOptimalPostingTimes } from '../utils/postingTimes'
import { uploadYouTubeShort } from './publish'
import { VideoWithCaption } from '@/types/video'
import { getNextCartoonToggle } from '../utils/cartoonToggle'

export async function autoScheduleYouTubePost(video: VideoWithCaption) {
  const { shouldUseCartoon } = await getNextCartoonToggle()

  const scheduledTime = await getOptimalPostingTimes('youtube')
  const result = await uploadYouTubeShort(video, scheduledTime)

  return {
    platform: 'youtube',
    scheduledTime,
    isCartoon: shouldUseCartoon,
    videoId: result.videoId,
  }
} 