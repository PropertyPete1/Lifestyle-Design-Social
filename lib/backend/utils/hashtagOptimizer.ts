export function generateHashtags(contentType: 'real_estate' | 'cartoon', location: string): string[] {
  const commonTags = ['#realestate', '#newlisting', '#homesweethome', '#househunting']
  const cartoonTags = ['#cartoonvideo', '#aivideo', '#animatedreels']

  const locationTag = `#${location.replace(/\s+/g, '').toLowerCase()}`

  if (contentType === 'cartoon') {
    return [...cartoonTags, locationTag]
  }

  return [...commonTags, locationTag]
} 