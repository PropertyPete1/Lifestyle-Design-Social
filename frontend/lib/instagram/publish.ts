import { InstagramPostPayload } from './types'

export async function publishToInstagram({
  videoUrl,
  caption,
  accessToken,
  userId,
}: InstagramPostPayload): Promise<{ success: boolean }> {
  try {
    const createContainerRes = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media`,
      {
        method: 'POST',
        body: new URLSearchParams({
          media_type: 'REEL',
          video_url: videoUrl,
          caption,
          access_token: accessToken,
        }),
      }
    )

    const { id } = await createContainerRes.json()

    const publishRes = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media_publish`,
      {
        method: 'POST',
        body: new URLSearchParams({
          creation_id: id,
          access_token: accessToken,
        }),
      }
    )

    return { success: publishRes.ok }
  } catch (err) {
    console.error('[Instagram Publish Error]', err)
    return { success: false }
  }
} 