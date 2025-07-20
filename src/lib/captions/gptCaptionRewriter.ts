import { openai } from '../ai/openaiClient';

export async function rewriteCaptionWithStyle(baseCaption: string): Promise<string> {
  const prompt = `
You are a viral caption expert. Rewrite the following Instagram caption to be:
1. Catchy and fun
2. Friendly tone for home buyers or renters
3. Use emojis, break up lines, and include a light hook
Caption: "${baseCaption}"
Final rewritten caption:
`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  return res.choices[0]?.message?.content?.trim() || baseCaption;
} 