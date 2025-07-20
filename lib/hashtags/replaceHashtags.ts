import { getTrendingHashtags } from './getTrendingHashtags';

export async function replaceHashtags(caption: string): Promise<string> {
  const trending = await getTrendingHashtags(10);
  const withoutOldTags = caption.replace(/#[\w]+/g, '').trim();
  const newHashtags = trending.map((tag) => `#${tag}`).join(' ');
  return `${withoutOldTags}\n\n${newHashtags}`;
} 