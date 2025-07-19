import { postToInstagram } from './postToInstagram'
import { postToYouTube } from './postToYouTube'
import { prepareFinalCaption } from './prepareFinalCaption'

export async function postNow(videoUrl: string, originalCaption: string) {
  const finalCaption = await prepareFinalCaption(originalCaption)
  await postToInstagram(videoUrl, finalCaption)
  await postToYouTube(videoUrl, finalCaption)
} 