import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function enhanceCaption(baseCaption: string): Promise<string> {
  const { choices } = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "Rewrite this caption in a slightly more viral tone. Only change a few words and update hashtags.",
      },
      {
        role: "user",
        content: baseCaption,
      },
    ],
    model: "gpt-4",
  });

  return choices[0].message.content?.trim() || baseCaption;
} 