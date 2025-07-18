import { NextRequest, NextResponse } from 'next/server'
import { generateCartoonVideo } from '@/lib/openai/cartoon'

export async function POST(req: NextRequest) {
  const { prompt, aspect } = await req.json()

  try {
    const url = await generateCartoonVideo(prompt, aspect)
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Cartoon generation failed:', error)
    return NextResponse.json({ error: 'Failed to generate cartoon' }, { status: 500 })
  }
} 