type QueueItem = {
  platform: 'instagram' | 'youtube' | 'tiktok'
  videoId: string
  scheduledTime: string
}

const queue: QueueItem[] = []

export function addToQueue(item: QueueItem) {
  queue.push(item)
}

export function getNextInQueue(): QueueItem | undefined {
  return queue.shift()
}

export function peekQueue(): QueueItem[] {
  return [...queue]
} 