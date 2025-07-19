import { db } from '../db'

export async function analyzeTopCaptions(): Promise<string[]> {
  const posts = await db.instagramPost.findMany({
    orderBy: { timestamp: 'desc' },
  })

  const keywords = new Set<string>()

  // Limit to 20 most recent posts
  const recentPosts = posts.slice(0, 20)

  for (const post of recentPosts) {
    const words = post.caption?.split(/\s+/) || []
    words.forEach(word => {
      if (word.startsWith('#')) {
        keywords.add(word.toLowerCase())
      }
    })
  }

  return Array.from(keywords)
} 