import { db } from '../db'
import { improveCaption } from './improveCaption'

export async function syncImprovedCaptions() {
  const posts = await db.instagramPost.findMany()

  for (const post of posts) {
    const improved = improveCaption(post.caption)
    await db.instagramPost.update({
      where: { igId: post.igId },
      data: { improvedCaption: improved },
    })
  }
} 