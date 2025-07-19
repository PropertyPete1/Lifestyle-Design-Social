import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  // 🧪 TEMP: Hardcoded user validation
  if (email === 'test@example.com' && password === 'password123') {
    const cookie = serialize('token', 'mock-session-token', {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 1 day
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ message: 'Login successful' });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
} 