export async function getOptimalPostingTimes(platform: 'instagram' | 'tiktok' | 'youtube') {
  const now = new Date()
  now.setHours(now.getHours() + 1)

  // Default mock values per platform (can be made dynamic later)
  const timeMap = {
    instagram: new Date(now.getTime() + 60 * 60 * 1000),
    tiktok: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    youtube: new Date(now.getTime() + 3 * 60 * 60 * 1000),
  }

  return timeMap[platform].toISOString()
} 