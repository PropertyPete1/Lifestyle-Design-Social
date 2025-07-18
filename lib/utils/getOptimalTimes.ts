export function getOptimalTimes(platform: 'instagram' | 'youtube' | 'tiktok'): string[] {
  if (platform === 'instagram') return ['9:00 AM', '1:00 PM', '7:00 PM']
  if (platform === 'youtube') return ['10:00 AM', '2:00 PM', '8:00 PM']
  return ['11:00 AM', '3:00 PM', '9:00 PM']
} 