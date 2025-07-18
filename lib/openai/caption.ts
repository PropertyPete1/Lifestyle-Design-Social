import OpenAI from "openai";

const openai = new OpenAI();

export async function generateCaption(description: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a social media caption expert." },
      { role: "user", content: `Write an engaging caption for: ${description}` },
    ],
  });

  return res.choices[0].message.content || "";
} 