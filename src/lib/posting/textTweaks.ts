export function slightlyRewrite(text: string): string {
  const replacements: Record<string, string> = {
    "home": "place",
    "🔥": "💥",
    "this kitchen": "this layout",
    "dream": "goal",
    "perfect": "ideal",
    "amazing": "beautiful",
    "must-see": "can't-miss",
  };

  let rewritten = text;

  for (const [original, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(original, "gi");
    rewritten = rewritten.replace(regex, replacement);
  }

  // Simple shuffle: move a sentence to the front
  const parts = rewritten.split(". ");
  if (parts.length > 1) {
    const first = parts.pop();
    if (first) parts.unshift(first);
    rewritten = parts.join(". ");
  }

  return rewritten.trim();
}

export function tweakText(text: string): string {
  return text
    .replace(/\n{2,}/g, '\n')        // remove excess newlines
    .replace(/\s{2,}/g, ' ')          // trim double spaces
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1 $2'); // spacing between lowercase-uppercase patterns
}

export function fallbackEnhance(caption: string): string {
  const emojis = ['✨', '🔥', '🏡', '💡', '📍', '💬'];
  const ending = ['Ready to move in?', 'DM me for more info!', 'Tag someone who needs this!', 'Which room is your favorite?'];
  const randEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  const randEnd = ending[Math.floor(Math.random() * ending.length)];
  return `${randEmoji} ${caption} — ${randEnd}`;
}

export function prepareCaption(caption: string, hashtags: string[]): string {
  const cleanCaption = caption.length > 2200 ? caption.slice(0, 2190) : caption;
  const tagBlock = hashtags.map((tag) => `#${tag}`).join(' ');
  return `${fallbackEnhance(cleanCaption)}\n\n${tagBlock}`;
} 