import { IG_ACCESS_TOKEN } from './constants'

export async function getMediaDetails(mediaId: string) {
  const res = await fetch(
    `https://graph.instagram.com/${mediaId}?fields=id,media_type,media_url,timestamp&access_token=${IG_ACCESS_TOKEN}`
  )
  const json = await res.json()
  return json
} 