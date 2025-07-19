import { alternateContent } from './alternateContent'
import { generatePostTimeSlots } from '../utils/generatePostTimeSlots'

export function smartQueue(fileNames: string[]): { file: string; time: string }[] {
  const alternated = alternateContent(fileNames)
  const slots = generatePostTimeSlots()
  const queue: { file: string; time: string }[] = []

  for (let i = 0; i < alternated.length; i++) {
    const time = slots[i % slots.length]
    queue.push({ file: alternated[i], time })
  }

  return queue
} 