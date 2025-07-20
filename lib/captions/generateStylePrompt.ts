import { CaptionStats } from '../../types';

export function generateStylePrompt(captions: CaptionStats[], newVideoTopic: string): string {
  const examples = captions.map(
    (cap, i) => `Example ${i + 1}:\n"${cap.caption}"\nEngagement: ${cap.engagement}`
  );

  return `
You're a real estate content expert. Mimic the style and energy of these high-performing captions, but rewrite them to match this topic: "${newVideoTopic}". Keep it catchy, similar tone, and swap in new trending hashtags.

${examples.join('\n\n')}

Now write a new caption below that could go viral:
`;
} 