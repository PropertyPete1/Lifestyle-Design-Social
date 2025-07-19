import { generateDescription } from './generateDescription'
import { generateTitle } from './generateTitle'

export function improveYouTubePost(caption: string): {
  title: string
  description: string
} {
  const lines = caption.split('\n').filter(Boolean)
  const title = lines[0].slice(0, 100)
  const description = caption
    .replace(/#[\w]+/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim()

  return {
    title,
    description,
  }
} 