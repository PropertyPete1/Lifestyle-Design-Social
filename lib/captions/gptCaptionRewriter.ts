import OpenAI from 'openai';
import { analyzeTopCaptions } from './analyzeTopCaptions';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function rewriteCaptionWithStyle(baseCaption: string): Promise<string> {
  const topCaptions = await analyzeTopCaptions(5);
  const styleSample = topCaptions.map((c) => c.text).join('\n');

  const prompt = `You are a social media expert. Rewrite the following caption to match the viral tone and style of these past captions:\n\n${styleSample}\n\nNew caption:\n${baseCaption}\n\nRewritten:`;

  const res = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4',
    temperature: 0.8,
  });

  return res.choices[0].message.content?.trim() || baseCaption;
} 