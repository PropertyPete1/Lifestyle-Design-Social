// 🛠️ Instructions:
// • Create this file exactly at the path above.
// • It handles the POST request to generate AI captions using your OpenAI setup.

import { NextResponse } from 'next/server';
import { generateCaptionWithHashtags } from '@/lib/openai/caption';
import { Video } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body: Video = await req.json();
    const { caption } = await generateCaptionWithHashtags(body);

    return NextResponse.json({ caption });
  } catch (error) {
    console.error('[API:CAPTION]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 