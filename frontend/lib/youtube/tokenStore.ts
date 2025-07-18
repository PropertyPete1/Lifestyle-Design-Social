import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.join(process.cwd(), 'youtube_token.json');

export function saveToken(token: any) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
}

export function loadToken(): any | null {
  if (fs.existsSync(TOKEN_PATH)) {
    const raw = fs.readFileSync(TOKEN_PATH, 'utf-8');
    return JSON.parse(raw);
  }
  return null;
} 