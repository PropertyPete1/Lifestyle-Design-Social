import { queueInstagramPosts } from './queueInstagramPosts'
import { queueYouTubePosts } from './queueYouTubePosts'

export async function queueAllPosts() {
  await queueInstagramPosts()
  await queueYouTubePosts()
} 