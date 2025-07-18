import { VideoItem } from '@/types'

export function alternateCartoonRealEstate(videos: VideoItem[]): VideoItem[] {
  const realEstate = videos.filter((v) => v.type === 'real_estate')
  const cartoon = videos.filter((v) => v.type === 'cartoon')

  const result: VideoItem[] = []
  while (realEstate.length || cartoon.length) {
    if (realEstate.length) result.push(realEstate.shift()!)
    if (cartoon.length) result.push(cartoon.shift()!)
  }

  return result
} 