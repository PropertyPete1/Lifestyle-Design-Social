import { VideoWithCaption } from '@/types/video'

export async function uploadYouTubeShort(video: VideoWithCaption, scheduledTime: string) {
  // TODO: Implement YouTube Data API upload logic
  console.log('Uploading YouTube Short:', {
    videoUrl: video.url,
    caption: video.caption,
    scheduledTime,
  })

  return {
    videoId: `yt-${Math.floor(Math.random() * 100000)}`,
  }
} 