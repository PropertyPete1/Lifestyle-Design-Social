import CartoonVideo from '../models/CartoonVideo'

export async function saveCartoonMetadata({
  userId,
  prompt,
  aspectRatio,
  videoUrl,
  provider = 'runwayml',
}) {
  return await CartoonVideo.create({
    userId,
    prompt,
    aspectRatio,
    videoUrl,
    provider,
    status: 'complete',
  })
}
