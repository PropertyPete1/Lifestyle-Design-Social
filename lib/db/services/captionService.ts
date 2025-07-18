import Caption from '../models/Caption'

export async function saveCaption({
  userId,
  prompt,
  caption,
  hashtags,
}: {
  userId: string
  prompt: string
  caption: string
  hashtags: string[]
}) {
  return await Caption.create({ userId, prompt, caption, hashtags })
}

export async function getCaptions(userId: string) {
  return await Caption.find({ userId }).sort({ createdAt: -1 }).limit(50)
} 