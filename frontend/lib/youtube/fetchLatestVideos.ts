import { YT_API_KEY, YT_CHANNEL_ID } from './constants'

export async function fetchLatestVideos() {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}&channelId=${YT_CHANNEL_ID}&part=snippet,id&order=date&maxResults=5`
  const res = await fetch(url)
  const json = await res.json()
  return json.items
} 