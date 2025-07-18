export function categorizeVideoByFilename(filename: string): 'cartoon' | 'real_estate' {
  const name = filename.toLowerCase()
  if (name.includes('cartoon') || name.includes('ai') || name.includes('animated')) {
    return 'cartoon'
  }
  return 'real_estate'
} 