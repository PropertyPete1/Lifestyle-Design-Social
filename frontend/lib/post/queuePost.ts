import { db } from '../db'
import { prepareFinalCaption } from './prepareFinalCaption'

export async function queuePost(videoUrl: string, originalCaption: string, scheduledTime: Date) {
  const finalCaption = await prepareFinalCaption(originalCaption)

  await db.scheduledPost.create({
    data: {
      videoUrl,
      caption: finalCaption,
      scheduledFor: scheduledTime,
    },
  })
} 