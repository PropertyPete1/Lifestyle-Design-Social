import { IG_ACCESS_TOKEN } from './constants'

export async function fetchCaption(postId: string): Promise<string | null> {
  const res = await fetch(`https://graph.instagram.com/${postId}?fields=caption&access_token=${IG_ACCESS_TOKEN}`)
  const json = await res.json()
  return json.caption ?? null
} 