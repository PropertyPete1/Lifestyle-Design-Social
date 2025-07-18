export function formatTitleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, '');
  return base.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export function generateDescription(): string {
  return `Auto-posted via Lifestyle Design Social 🎥✨`;
} 