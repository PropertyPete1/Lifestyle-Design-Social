import { getTopCaptions } from '../db/captionStorage';
import { getTrendingHashtags } from '../hashtags/getTrendingHashtags';
import { tweakText } from '../posting/textTweaks';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function enhanceCaptionWithGPT(original: string): Promise<string> {
  const topCaptions = await getTopCaptions();
  const trending = await getTrendingHashtags();

  const prompt = `
You are an expert social media copywriter. Mimic the style of these captions:
---
${topCaptions.join('\n')}
---
Now rewrite the following caption with a few tweaks for virality. Include emojis, make it engaging, but keep it real estate focused:
"${original}"
Add 5 trending hashtags, but avoid repeating hashtags used before.
Trending hashtags to choose from: ${trending.join(', ')}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const rewritten = response.choices[0].message.content;
  return tweakText(rewritten || original);
} 