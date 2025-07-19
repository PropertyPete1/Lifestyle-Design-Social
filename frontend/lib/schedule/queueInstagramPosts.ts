import { db } from '../db'

export async function queueInstagramPosts() {
  const posts = await db.instagramPost.findMany({
    where: { improvedCaption: { not: null } },
    orderBy: { timestamp: 'desc' },
  })

  const cartoonPosts = posts.filter(p => p.caption.includes('cartoon'))
  const realPosts = posts.filter(p => !p.caption.includes('cartoon'))

  const queue = []
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const day = new Date(today)
    day.setDate(today.getDate() + i)
    const times = ['09:00', '13:00', '18:00']
    for (let t = 0; t < times.length; t++) {
      const useCartoon = (i * 3 + t) % 2 === 0
      const nextPost = useCartoon ? cartoonPosts.shift() : realPosts.shift()
      if (!nextPost) continue
      queue.push({
        igId: nextPost.igId,
        scheduledFor: `${day.toISOString().split('T')[0]}T${times[t]}:00Z`,
      })
    }
  }

  for (const job of queue) {
    await db.scheduledPost.create({
      data: {
        platform: 'instagram',
        igId: job.igId,
        scheduledFor: new Date(job.scheduledFor),
      },
    })
  }
} 