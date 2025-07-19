export function getVideoType(caption: string): 'cartoon' | 'real_estate' {
  const cartoonKeywords = ['cartoon', 'animated', 'drawn']
  const lowered = caption.toLowerCase()
  return cartoonKeywords.some(k => lowered.includes(k)) ? 'cartoon' : 'real_estate'
} 