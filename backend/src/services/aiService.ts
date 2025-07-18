import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const generateCaption = async (videoTitle: string): Promise<string> => {
  const prompt = `Write an engaging real estate caption for: "${videoTitle}"`;
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });

  return response.data.choices[0].message?.content || '';
};

export const generateHashtags = async (videoTitle: string): Promise<string[]> => {
  const prompt = `Generate 10 real estate hashtags for: "${videoTitle}"`;
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.data.choices[0].message?.content || '';
  return text.match(/#\w+/g) || [];
}; 