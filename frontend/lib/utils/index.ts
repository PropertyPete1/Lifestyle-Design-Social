export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
} 