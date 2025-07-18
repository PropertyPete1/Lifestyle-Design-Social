import { uploadToS3 } from '@/lib/utils/s3Uploader'
import { saveCartoonMetadata } from '@/lib/db/cartoonService'

export async function generateCartoonVideo(prompt: string, aspect: string): Promise<string> {
  // TODO: Replace this with real cartoon generation API call (RunwayML, etc.)
  const res = await fetch('https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')
  const buffer = await res.arrayBuffer()
  const mimeType = 'video/mp4'

  const url = await uploadToS3(Buffer.from(buffer), mimeType)

  await saveCartoonMetadata({
    userId: 'demo-user-id',
    prompt,
    aspectRatio: aspect,
    videoUrl: url,
  })

  return url
} 