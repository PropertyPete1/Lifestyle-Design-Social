import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { videoType, tone, style, location } = await req.json();

    const prompt = `
You are a professional real estate copywriter. Write an engaging caption and optimized hashtags for a ${videoType} video.
Tone: ${tone || 'friendly'}
Style: ${style || 'Instagram-friendly'}
Location: ${location || 'San Antonio, TX'}
Hashtags should be a mix of trending, evergreen, niche, and geo-targeted. Return in JSON:
{
  "caption": "...",
  "hashtags": ["...", "...", ...]
}
`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4',
    });

    const content = completion.choices[0].message.content;
    const result = JSON.parse(content || '{}');

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error generating caption:', error);
    return NextResponse.json({ message: 'Error generating caption' }, { status: 500 });
  }
} 