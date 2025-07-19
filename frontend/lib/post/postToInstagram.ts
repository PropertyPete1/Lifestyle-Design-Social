import { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID } from '../instagram/constants'

export async function postToInstagram(videoUrl: string, caption: string) {
  const containerRes = await fetch(
    `https://graph.facebook.com/v17.0/${INSTAGRAM_USER_ID}/media`,
    {
      method: 'POST',
      body: new URLSearchParams({
        video_url: videoUrl,
        caption,
        access_token: INSTAGRAM_ACCESS_TOKEN,
        media_type: 'REELS',
      }),
    }
  )

  const { id: creationId } = await containerRes.json()

  await fetch(`https://graph.facebook.com/v17.0/${INSTAGRAM_USER_ID}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({
      creation_id: creationId,
      access_token: INSTAGRAM_ACCESS_TOKEN,
    }),
  })
} 