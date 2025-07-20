import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function gptMimicCaption(baseCaption: string, topCaptions: string[]): Promise<string> {
  const messages = [
    {
      role: 'system' as const,
      content: 'You are a social media expert helping improve captions for real estate videos.',
    },
    {
      role: 'user' as const,
      content: `Here are some high-performing captions:\n\n${topCaptions.join('\n')}\n\nHere is a new caption:\n${baseCaption}\n\nMimic the style and improve it slightly.`,
    },
  ];

  const res = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    max_tokens: 100,
  });

  return res.choices[0].message?.content?.trim() || baseCaption;
} 