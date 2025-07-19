import { rewriteHashtags } from './hashtagRewriter'
import { analyzeTopCaptions } from './analyzeTopCaptions'

export async function smartEnhanceCaption(original: string): Promise<string> {
  const trending = await analyzeTopCaptions()
  const enhanced = rewriteHashtags(original)

  const extra = trending.slice(0, 3).join(' ')
  return `${enhanced} ${extra}`
} 