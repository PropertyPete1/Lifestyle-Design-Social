import Video from '../models/Video'

export async function attachCaptionToVideo(videoId: string, captionId: string) {
  return await Video.findByIdAndUpdate(videoId, { captionId }, { new: true })
} 