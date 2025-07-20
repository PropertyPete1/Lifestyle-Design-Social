import { getTopHashtags } from './getTopHashtags';

export async function replaceWeakHashtags(originalCaption: string): Promise<string> {
  const hashtags = originalCaption.match(/#[\w]+/g) || [];
  const top = await getTopHashtags(15);

  const trendingTags = top.map((h) => h.tag.toLowerCase());
  const filtered = hashtags.filter((tag) => trendingTags.includes(tag.toLowerCase()));

  const replacementCount = Math.max(0, 3 - filtered.length);
  const toAdd = top
    .filter((h) => !filtered.includes(h.tag.toLowerCase()))
    .slice(0, replacementCount)
    .map((h) => h.tag);

  const cleanedCaption = originalCaption.replace(/#[\w]+/g, '').trim();
  return `${cleanedCaption} ${[...filtered, ...toAdd].join(' ')}`.trim();
} 