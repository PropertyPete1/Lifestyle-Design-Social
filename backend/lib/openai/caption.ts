// 🛠️ Instructions:
// • Create this file exactly at the path above.
// • It defines the function used to generate smart captions with hashtags.

import { openai } from '@/lib/utils/openaiClient';

export async function generateCaptionWithHashtags(transcript: string): Promise<string> {
  const prompt = `
You're a top real estate social media strategist. Based on the following transcript, write a short, exciting Instagram caption and include 5 trending hashtags that match the vibe.

Transcript:
${transcript}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  });

  return completion.choices[0].message.content ?? '';
} 