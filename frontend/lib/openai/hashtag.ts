import { openai } from "../utils/openaiClient";

export async function generateHashtags(prompt: string): Promise<string[]> {
  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0]?.message?.content
    ?.split(/[\s,#\n]+/)
    .filter((tag) => tag.startsWith("#"))
    .slice(0, 10);
} 