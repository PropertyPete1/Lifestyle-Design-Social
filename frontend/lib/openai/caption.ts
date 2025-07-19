import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCaptionWithHashtags(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that writes Instagram captions with trending hashtags.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || '';
} 