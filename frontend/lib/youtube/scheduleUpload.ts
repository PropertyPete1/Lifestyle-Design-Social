import { YouTubeVideo } from './types'

export async function scheduleUpload(video: YouTubeVideo): Promise<void> {
  console.log(`Pretending to upload video: ${video.title}`)
  // TODO: Replace with actual upload logic using OAuth2
} 