import { fetchRecentPosts } from './fetchRecentPosts'

export async function detectHighPerformers(): Promise<string[]> {
  const posts = await fetchRecentPosts()
  const good = posts.filter((post) => post.caption?.length && post.caption.length > 80)
  return good.map((p) => p.caption || '').slice(0, 3)
} 