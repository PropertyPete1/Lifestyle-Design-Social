import { generateTrendingHashtags } from './generateTrendingHashtags'

export function improveCaption(original: string): string {
  const improved = original
    .replace(/Check out/g, 'You won\'t believe')
    .replace(/amazing/g, 'stunning')
    .replace(/now available/g, 'just hit the market')
  return generateTrendingHashtags(improved)
} 