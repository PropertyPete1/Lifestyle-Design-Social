import { InstagramMediaItem } from './types'
import { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID } from './constants'

export async function fetchRecentPosts(): Promise<InstagramMediaItem[]> {
  const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=id,caption,media_type,media_url,timestamp&access_token=${INSTAGRAM_ACCESS_TOKEN}`
  const res = await fetch(url)
  const json = await res.json()
  return json.data ?? []
} 