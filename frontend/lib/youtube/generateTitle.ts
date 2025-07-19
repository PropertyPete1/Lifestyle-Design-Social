export function generateTitle(caption: string): string {
  const lines = caption.split('\n')
  const firstLine = lines.find(line => line.length > 20) || 'New Home Tour 🎥'
  return firstLine.replace(/#\w+/g, '').trim().slice(0, 100)
} 