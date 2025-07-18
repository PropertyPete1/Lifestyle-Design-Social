import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // TODO: Replace with real validation/auth logic
  if (email === 'test@example.com' && password === 'password') {
    const token = jwt.sign({ userId: '12345' }, process.env.JWT_SECRET || '', { expiresIn: '1d' });
    return res.status(200).json({ token });
  }

  res.status(401).json({ message: 'Invalid credentials' });
};

export const registerUser = async (req: Request, res: Response) => {
  // Stub logic for registration
  res.status(201).json({ message: 'User registered' });
}; 