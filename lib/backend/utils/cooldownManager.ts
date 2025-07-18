const postedVideos: Record<string, Date> = {}

export function canPostVideo(videoId: string): boolean {
  const lastPosted = postedVideos[videoId]
  if (!lastPosted) return true

  const now = new Date()
  const diff = (now.getTime() - lastPosted.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 7
}

export function markVideoAsPosted(videoId: string): void {
  postedVideos[videoId] = new Date()
} 