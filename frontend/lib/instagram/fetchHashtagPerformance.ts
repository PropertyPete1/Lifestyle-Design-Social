import { fetchRecentPosts } from './fetchRecentPosts'

export async function fetchHashtagPerformance(): Promise<Record<string, number>> {
  const posts = await fetchRecentPosts()
  const map: Record<string, number> = {}

  for (const post of posts) {
    const words = post.caption?.split(/\s+/) || []
    for (const word of words) {
      if (word.startsWith('#')) {
        map[word] = (map[word] || 0) + 1
      }
    }
  }

  return map
} 