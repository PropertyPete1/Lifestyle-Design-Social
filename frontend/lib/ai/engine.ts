export async function analyzeCaption(caption: string): Promise<string[]> {
  return ['🔥 Trending format', 'Add emojis', 'Shorten sentences']
}

export function rewriteCaption(caption: string, strategies: string[]): string {
  let result = caption
  if (strategies.includes('🔥 Trending format')) {
    result = result.replace(/\./g, ' ‼️')
  }
  if (strategies.includes('Add emojis')) {
    result += ' 🎥✨'
  }
  if (strategies.includes('Shorten sentences')) {
    result = result.split('.').map(s => s.trim()).filter(Boolean).join('. ')
  }
  return result
} 