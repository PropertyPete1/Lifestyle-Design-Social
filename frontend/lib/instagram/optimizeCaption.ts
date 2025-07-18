import { fetchInstagramCaptions } from './fetchCaptions';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateOptimizedCaptionFromHistory(userId: string, originalCaption: string) {
  const history = await fetchInstagramCaptions(userId);
  const successfulCaptions = history.filter(c => c.engagementRate && c.engagementRate > 0.15);

  const examples = successfulCaptions.map(c => `• ${c.caption}`).join('\n');

  const prompt = `
You are a social media expert for a real estate brand.

Here are previous Instagram captions that performed well:
${examples}

Here is a new caption we want to improve:
"${originalCaption}"

Using a similar voice and tone, write a more engaging version of this caption. Add 3 emojis and include trending real estate hashtags. Make it short, natural, and similar to the successful ones.
`;

  const res = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4',
  });

  const newCaption = res.choices[0].message.content;

  return newCaption;
} 