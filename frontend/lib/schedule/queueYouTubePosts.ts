import { db } from '../db'
import { improveYouTubePost } from '../youtube/improveYouTubePost'

export async function queueYouTubePosts() {
  const posts = await db.instagramPost.findMany({
    where: { improvedCaption: { not: null } },
    orderBy: { timestamp: 'desc' },
  })

  const cartoon = posts.filter(p => p.caption.includes('cartoon'))
  const real = posts.filter(p => !p.caption.includes('cartoon'))

  const queue = []
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const day = new Date(today)
    day.setDate(today.getDate() + i)
    const times = ['10:00', '14:00', '19:00']
    for (let t = 0; t < times.length; t++) {
      const useCartoon = (i * 3 + t) % 2 === 0
      const post = useCartoon ? cartoon.shift() : real.shift()
      if (!post) continue
      const { title, description } = improveYouTubePost(post.caption)
      queue.push({
        platform: 'youtube',
        igId: post.igId,
        scheduledFor: `${day.toISOString().split('T')[0]}T${times[t]}:00Z`,
        title,
        description,
      })
    }
  }

  for (const item of queue) {
    await db.scheduledPost.create({
      data: {
        platform: 'youtube',
        igId: item.igId,
        scheduledFor: new Date(item.scheduledFor),
        title: item.title,
        description: item.description,
      },
    })
  }
} 