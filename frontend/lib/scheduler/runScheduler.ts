import { db } from '../db'
import { postToInstagram } from '../instagram/postToInstagram'
import { postToYouTube } from '../youtube/postToYouTube'

export async function runScheduler() {
  setInterval(async () => {
    const now = new Date()
    const due = await db.scheduledPost.findMany({
      where: {
        postedAt: null,
        scheduledFor: { lte: now },
      },
    })

    for (const job of due) {
      try {
        const post = await db.instagramPost.findUnique({
          where: { igId: job.igId },
        })
        if (!post) continue

        if (job.platform === 'instagram') {
          await postToInstagram(post)
        } else if (job.platform === 'youtube') {
          await postToYouTube(post)
        }

        await db.scheduledPost.update({
          where: { id: job.id },
          data: { postedAt: new Date() },
        })
      } catch (e) {
        console.error('Error running scheduled post', e)
      }
    }
  }, 60000)
} 