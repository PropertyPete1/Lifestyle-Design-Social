import { analyzeCaption, rewriteCaption } from './engine'

export async function enhanceCaption(original: string): Promise<string> {
  const analysis = await analyzeCaption(original)
  return rewriteCaption(original, analysis)
} 