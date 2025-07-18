import { NextRequest, NextResponse } from 'next/server'
import { generateCaptionWithHashtags } from '@/lib/openai/caption'
import { saveCaption } from '@/lib/db/services/captionService'
import { attachCaptionToVideo } from '@/lib/db/services/videoService'

export async function POST(req: NextRequest) {
  const { prompt, videoId } = await req.json()
  const userId = 'demo-user-id'

  try {
    const result = await generateCaptionWithHashtags(prompt)

    const saved = await saveCaption({
      userId,
      prompt,
      caption: result.caption,
      hashtags: result.hashtags,
    })

    if (videoId) {
      await attachCaptionToVideo(videoId, saved._id.toString())
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('Caption generation error:', e)
    return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 })
  }
} 