export function sanitizeCaption(caption: string): string {
  return caption.replace(/\s+/g, ' ').trim()
} 