import { db } from '../db'

export async function generateHashtagStats() {
  const posts = await db.instagramPost.findMany({
    where: { improvedCaption: { not: null } },
  })

  const stats: Record<string, number> = {}

  for (const post of posts) {
    const matches = post.improvedCaption.match(/#[\w]+/g) || []
    for (const tag of matches) {
      stats[tag] = (stats[tag] || 0) + 1
    }
  }

  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1])
  return sorted
} 