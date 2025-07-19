export function generateThumbnail(videoUrl: string): string {
  const fallback = '/default-thumbnail.jpg'
  if (!videoUrl.includes('youtube.com')) return fallback
  const videoId = new URL(videoUrl).searchParams.get('v')
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
} 