import { generateHashtags } from '../openai/hashtag'

export async function replaceHashtags(caption: string): Promise<string> {
  const words = caption.split(/\s+/)
  const newHashtags = await generateHashtags('Generate trending hashtags for social media')

  return words
    .map((word) => (word.startsWith('#') ? newHashtags.shift() ?? word : word))
    .join(' ')
} 