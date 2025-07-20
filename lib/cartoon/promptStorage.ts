import fs from 'fs/promises';
import path from 'path';

const promptFilePath = path.resolve(process.cwd(), 'data/cartoonPrompts.json');

export async function getPrompts(): Promise<string[]> {
  try {
    const data = await fs.readFile(promptFilePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function savePrompt(newPrompt: string): Promise<string[]> {
  const prompts = await getPrompts();
  if (!prompts.includes(newPrompt)) prompts.push(newPrompt);
  await fs.writeFile(promptFilePath, JSON.stringify(prompts, null, 2));
  return prompts;
}

export async function deletePrompt(promptToRemove: string): Promise<string[]> {
  let prompts = await getPrompts();
  prompts = prompts.filter(p => p !== promptToRemove);
  await fs.writeFile(promptFilePath, JSON.stringify(prompts, null, 2));
  return prompts;
} 