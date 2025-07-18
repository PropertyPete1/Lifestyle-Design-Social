import Analytics from '../models/Analytics'

export async function getUserAnalytics(userId: string) {
  return await Analytics.find({ userId }).sort({ postedAt: -1 })
}

export async function saveAnalytics(data: {
  userId: string
  platform: string
  videoId: string
  views: number
  likes: number
  comments: number
  shares: number
  postedAt: Date
}) {
  const engagement =
    (data.likes + data.comments + data.shares) / Math.max(1, data.views)

  return await Analytics.create({
    ...data,
    engagementRate: Number(engagement.toFixed(3)),
  })
}
