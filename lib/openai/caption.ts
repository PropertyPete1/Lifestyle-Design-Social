import { openai } from '../utils/openaiClient';

export async function generateCaptionWithHashtags(videoType: 'real' | 'cartoon', filename: string): Promise<string> {
  const prompt =
    videoType === 'real'
      ? `You're helping a real estate agent write a caption. Use clear, engaging language and include relevant hashtags. Filename: ${filename}`
      : `You're creating a fun cartoon-style caption for real estate marketing. Include humor and trending hashtags. Filename: ${filename}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0].message.content || '';
} 