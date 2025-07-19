import { fetchRecentPosts } from './fetchRecentPosts'
import { db } from '../db'

export async function syncCaptions() {
  const posts = await fetchRecentPosts()

  for (const post of posts) {
    await db.instagramPost.upsert({
      where: { igId: post.id },
      update: { caption: post.caption },
      create: {
        igId: post.id,
        caption: post.caption,
        mediaType: post.media_type,
        mediaUrl: post.media_url,
        timestamp: post.timestamp,
      },
    })
  }
} 