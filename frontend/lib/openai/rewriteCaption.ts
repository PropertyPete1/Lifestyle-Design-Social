export function rewriteCaption(caption: string): string {
  return `✨ ${caption.trim().replace(/\.$/, '')}! Tap ❤️ if you agree!`
} 