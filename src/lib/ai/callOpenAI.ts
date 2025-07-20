import axios from 'axios';
import * as Sentry from '@sentry/node';

export async function callOpenAI(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    Sentry.captureException(error, {
      tags: { component: 'callOpenAI', api: 'openai' },
      extra: { prompt: prompt.substring(0, 100) + '...' }
    });
    throw new Error('Failed to generate caption with OpenAI');
  }
} 