// 🛠️ Instructions:
// • Create this file exactly at the path above.
// • This uses the OpenAI API to generate captions and hashtags for a video.

import openai from '@/lib/utils/openaiClient';

export async function generateCaptionWithHashtags(videoDescription: string): Promise<{
  caption: string;
  hashtags: string[];
}> {
  const prompt = `Write an engaging Instagram caption for the following real estate video:\n\n${videoDescription}\n\nAlso include 5 relevant trending hashtags.`;

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  });

  const content = response.data.choices[0].message?.content || '';

  const captionMatch = content.match(/^(.*?)(?:\n|$)/);
  const hashtagsMatch = content.match(/#\w+/g);

  return {
    caption: captionMatch?.[1]?.trim() || 'Check this out!',
    hashtags: hashtagsMatch?.slice(0, 5) || [],
  };
} 