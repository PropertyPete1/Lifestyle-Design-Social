import OpenAI from 'openai';
import { fetchInstagramCaptions } from '../instagram/fetchCaptions';

const openai = new OpenAI();

export async function generateOptimizedCaptionFromHistory(userId: string) {
  const captions = await fetchInstagramCaptions(userId);

  const topCaptions = captions
    .filter(c => c.engagementRate > 0.1)
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5);

  const styles = topCaptions.map(c => c.caption).join('\n');

  const prompt = `
You're an Instagram growth strategist helping a real estate agent. Here's their best performing captions:
${styles}

Now rewrite this new caption in their voice and tone, with better structure and stronger call-to-actions:
"${captions[0].upcomingCaption}"

Also replace the hashtags with a mix of trending, evergreen, and niche/location tags.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0].message.content;
} 