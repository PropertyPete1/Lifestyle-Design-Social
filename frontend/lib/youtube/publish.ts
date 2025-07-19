import { YouTubePostPayload } from './types'
import { YOUTUBE_UPLOAD_ENDPOINT } from './constants'

export async function publishToYouTube({
  videoUrl,
  title,
  description,
  accessToken,
}: YouTubePostPayload): Promise<{ success: boolean }> {
  try {
    const res = await fetch(YOUTUBE_UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          title,
          description,
        },
        status: {
          privacyStatus: 'public',
        },
      }),
    })

    return { success: res.ok }
  } catch (err) {
    console.error('[YouTube Publish Error]', err)
    return { success: false }
  }
} 