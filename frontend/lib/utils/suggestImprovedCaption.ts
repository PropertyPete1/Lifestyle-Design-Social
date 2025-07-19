export function suggestImprovedCaption(original: string): string {
  if (!original) return 'Check this out! 👀'
  return `${original.trim()} 🔥 Ready to tour? #LetsGo`
} 