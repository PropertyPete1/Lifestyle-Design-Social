export function formatYouTubeCaption(text: string): string {
  const hashtags = ['#realestate', '#homes', '#newbuild', '#austinrealestate', '#sanantoniohomes'];
  const cleanText = text.trim();
  const formatted = `${cleanText}\n\n${hashtags.join(' ')}`;
  return formatted;
} 