import { enhanceCaption } from './enhanceCaption'

export async function prepareFinalCaption(original: string): Promise<string> {
  const enhanced = await enhanceCaption(original)
  return `${enhanced} 🤩🏡 #LifestyleDesign`
} 