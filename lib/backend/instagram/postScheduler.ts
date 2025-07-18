import { getOptimalPostingTimes } from '../utils/postingTimes'
import { createInstagramMedia, publishInstagramMedia } from './publish'
import { VideoWithCaption } from '@/types/video'
import { getNextCartoonToggle } from '../utils/cartoonToggle'

export async function autoScheduleInstagramPost(video: VideoWithCaption) {
  const { shouldUseCartoon } = await getNextCartoonToggle()

  const scheduledTime = await getOptimalPostingTimes('instagram')
  const media = await createInstagramMedia(video, scheduledTime)

  if (!media?.id) {
    throw new Error('Failed to create media object.')
  }

  await publishInstagramMedia(media.id, scheduledTime)

  return {
    platform: 'instagram',
    scheduledTime,
    isCartoon: shouldUseCartoon,
    mediaId: media.id,
  }
} 