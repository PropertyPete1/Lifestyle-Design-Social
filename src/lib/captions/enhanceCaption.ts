import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function enhanceWithGPT(prompt: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a creative real estate social media copywriter.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 150,
    temperature: 0.8,
  });

  const reply = res.choices[0].message?.content;
  return reply || '';
} 