import OpenAI from "openai";

const openai = new OpenAI();

export async function suggestMusicStyle(caption: string, hashtags: string[]): Promise<string> {
  const prompt = `Suggest a background music style or genre that fits this caption: "${caption}" with these hashtags: ${hashtags.join(", ")}`;

  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a music expert that suggests background music for videos." },
      { role: "user", content: prompt },
    ],
  });

  return res.choices[0].message.content || "lofi chill beats";
} 