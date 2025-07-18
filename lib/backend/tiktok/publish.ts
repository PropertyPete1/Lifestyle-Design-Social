import { VideoWithCaption } from '@/types/video'

export async function uploadTikTokVideo(video: VideoWithCaption, scheduledTime: string) {
  console.log('Uploading TikTok video:', {
    videoUrl: video.url,
    caption: video.caption,
    scheduledTime,
  })

  return {
    videoId: `tt-${Math.floor(Math.random() * 100000)}`,
  }
} 