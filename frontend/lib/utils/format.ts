export function truncate(str: string, length = 100): string {
  return str.length > length ? str.slice(0, length) + '...' : str
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString()
} 