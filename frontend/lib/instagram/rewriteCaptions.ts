import { db } from '../db'
import { rewriteHashtags } from './hashtagRewriter'

export async function rewriteCaptions() {
  const posts = await db.instagramPost.findMany()

  for (const post of posts) {
    const improved = rewriteHashtags(post.caption || '')
    await db.instagramPost.update({
      where: { igId: post.igId },
      data: { improvedCaption: improved },
    })
  }
} 