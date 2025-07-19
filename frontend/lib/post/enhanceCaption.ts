import { rewriteCaption } from '../openai/rewriteCaption'
import { replaceHashtags } from '../instagram/replaceHashtags'

export async function enhanceCaption(original: string): Promise<string> {
  const rewritten = rewriteCaption(original)
  return await replaceHashtags(rewritten)
} 