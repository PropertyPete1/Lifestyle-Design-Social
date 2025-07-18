export function predictEngagementScore(caption: string, hashtags: string[]): number {
  const base = Math.random() * 5
  const hashtagBoost = Math.min(hashtags.length, 10) * 0.5
  const wordCountBoost = Math.min(caption.split(' ').length / 10, 2)

  return Math.min(10, base + hashtagBoost + wordCountBoost)
} 