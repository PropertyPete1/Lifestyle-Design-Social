import { OpenAI } from 'openai';
import { getPastInstagramCaptions } from '../db/captionStorage';
import { slightlyRewrite } from '../posting/textTweaks';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function mimicSuccessfulCaption(baseCaption: string): Promise<string> {
  const pastCaptions = await getPastInstagramCaptions();

  const prompt = `
You're an expert at writing viral real estate captions.

Here are 3 successful ones:
${pastCaptions.slice(0, 3).map((c, i) => `${i + 1}. ${c}`).join('\n')}

Now write a new caption inspired by these but based on:
"${baseCaption}"

Avoid repeating hashtags from past captions and use new trending ones.
Add emojis naturally but keep it short and catchy.

Your caption:
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  });

  const newCaption = completion.choices[0]?.message?.content || baseCaption;
  return slightlyRewrite(newCaption); // slight formatting tweaks
} 