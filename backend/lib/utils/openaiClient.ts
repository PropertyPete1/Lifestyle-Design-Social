// 🛠️ Instructions:
// • Create this file exactly at the path above.
// • It initializes the OpenAI client using your existing API key from .env.

import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}); 