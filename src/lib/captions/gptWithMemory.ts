import { getTopCaptions } from '../db/captionStorage';
import { getTrendingHashtags } from '../hashtags/getTrendingHashtags';
import { enhanceCaptionWithGPT } from './gptCaptionEnhancer';

export async function enhanceUsingMemory(original: string) {
  const pastCaptions = await getTopCaptions(5);
  const hashtags = await getTrendingHashtags();

  const prompt = `
Below are examples of real estate captions that performed well:
${pastCaptions.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Now improve this new caption using a similar tone and add 3 of these trending hashtags:
${hashtags.join(', ')}

New caption to improve:
"${original}"
  `;

  return enhanceCaptionWithGPT(original);
} 