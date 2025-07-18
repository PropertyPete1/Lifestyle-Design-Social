export function suggestMusicKeywords(contentMood: 'upbeat' | 'relaxed' | 'luxury'): string[] {
  switch (contentMood) {
    case 'upbeat':
      return ['trending upbeat', 'happy real estate music']
    case 'relaxed':
      return ['lofi house tour', 'calm walkthrough music']
    case 'luxury':
      return ['luxury lifestyle beat', 'cinematic tour music']
    default:
      return ['real estate background music']
  }
} 