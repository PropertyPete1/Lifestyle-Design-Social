export function extractVideoMetadata(filename: string): {
  duration: number
  resolution: string
  fileSizeMB: number
} {
  return {
    duration: Math.floor(Math.random() * 90) + 10,
    resolution: '1080p',
    fileSizeMB: Math.floor(Math.random() * 100) + 20,
  }
} 