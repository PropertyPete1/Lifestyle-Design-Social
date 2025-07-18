import axios from 'axios'

export async function postToInstagram(videoUrl: string, caption: string) {
  const accessToken = process.env.IG_ACCESS_TOKEN!
  const igUserId = process.env.IG_USER_ID!

  const mediaRes = await axios.post(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      media_type: 'REELS',
      video_url: videoUrl,
      caption: caption,
    },
    { params: { access_token: accessToken } }
  )

  const creationId = mediaRes.data.id

  await axios.post(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
    { creation_id: creationId },
    { params: { access_token: accessToken } }
  )

  return true
} 