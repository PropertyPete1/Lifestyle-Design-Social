import fs from 'fs/promises';
import path from 'path';

const promptsFilePath = path.resolve('./data/cartoonPrompts.json');

export async function getPrompts(): Promise<string[]> {
  try {
    const content = await fs.readFile(promptsFilePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function savePrompt(prompt: string): Promise<string[]> {
  const prompts = await getPrompts();
  const updated = [...new Set([...prompts, prompt])];
  await fs.writeFile(promptsFilePath, JSON.stringify(updated, null, 2));
  return updated;
}

export async function deletePrompt(prompt: string): Promise<string[]> {
  const prompts = await getPrompts();
  const updated = prompts.filter(p => p !== prompt);
  await fs.writeFile(promptsFilePath, JSON.stringify(updated, null, 2));
  return updated;
} 