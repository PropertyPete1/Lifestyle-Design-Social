import Video from '../db/models/Video'
import Caption from '../db/models/Caption'

export async function getCaptionForVideo(videoId: string): Promise<string> {
  const video = await Video.findById(videoId).populate('captionId')
  if (video?.captionId && typeof video.captionId !== 'string') {
    const cap = video.captionId as any
    return `${cap.caption}\n\n${cap.hashtags.map((h: string) => `#${h}`).join(' ')}`
  }
  return ''
} 