export function rewriteHashtags(caption: string): string {
  // Remove existing hashtags
  const withoutHashtags = caption.replace(/#[\w]+/g, '').trim()
  
  // Add optimized hashtags based on content
  const optimizedHashtags = generateOptimizedHashtags(withoutHashtags)
  
  return `${withoutHashtags}\n\n${optimizedHashtags}`
}

function generateOptimizedHashtags(content: string): string {
  const hashtags: string[] = []
  const lowerContent = content.toLowerCase()
  
  // Real estate hashtags
  if (lowerContent.includes('house') || lowerContent.includes('home') || lowerContent.includes('property')) {
    hashtags.push('#realestate', '#property', '#home', '#house')
  }
  
  // Cartoon hashtags
  if (lowerContent.includes('cartoon') || lowerContent.includes('animated')) {
    hashtags.push('#cartoon', '#animated', '#funny')
  }
  
  // General engagement hashtags
  hashtags.push('#lifestyle', '#design', '#social')
  
  return hashtags.join(' ')
} 