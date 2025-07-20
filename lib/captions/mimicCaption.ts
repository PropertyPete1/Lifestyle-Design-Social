import { analyzeTopCaptions } from './analyzeTopCaptions';
import { generateStylePrompt } from './generateStylePrompt';
import { callOpenAI } from '../ai/callOpenAI';

export async function mimicCaption(videoTopic: string): Promise<string> {
  const topCaptions = await analyzeTopCaptions();
  const prompt = generateStylePrompt(topCaptions, videoTopic);
  
  const response = await callOpenAI(prompt);
  return response.trim();
} 