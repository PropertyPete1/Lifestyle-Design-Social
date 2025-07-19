import { fetchTopHashtags } from './fetchTopHashtags'

export function generateTrendingHashtags(caption: string): string {
  const hashtags = fetchTopHashtags()
  const captionWithoutOldHashtags = caption.replace(/#[\w]+/g, '')
  return `${captionWithoutOldHashtags.trim()} ${hashtags.join(' ')}`
} 