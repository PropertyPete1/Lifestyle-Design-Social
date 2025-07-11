import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { UserModel } from '../models/User';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

const router = Router();
const userModel = new UserModel(pool);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('password').isLength({ min: 6 }),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, name, password } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await userModel.create({
      email,
      name,
      password: passwordHash,
    });

    // Generate token
    const token = generateToken(user.id);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        autoPostingEnabled: user.autoPostingEnabled,
      },
      token,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await userModel.updateLastLogin(user.id);

    // Generate token
    const token = generateToken(user.id);

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        autoPostingEnabled: user.autoPostingEnabled,
        instagramUsername: user.instagramUsername,
        testMode: user.testMode,
      },
      token,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await userModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        autoPostingEnabled: user.autoPostingEnabled,
        instagramUsername: user.instagramUsername,
        postingTimes: user.postingTimes,
        pinnedHours: user.pinnedHours,
        excludedHours: user.excludedHours,
        timezone: user.timezone,
        testMode: user.testMode,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// @route   PUT /api/auth/instagram
// @desc    Update Instagram credentials
// @access  Private
router.put('/instagram', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { instagramUsername, instagramAccessToken, instagramRefreshToken, instagramUserId } = req.body;

    const user = await userModel.updateInstagramCredentials(decoded.userId, {
      instagramUsername,
      instagramAccessToken,
      instagramRefreshToken,
      instagramUserId,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Instagram credentials updated for user: ${user.email}`);

    res.json({
      message: 'Instagram credentials updated successfully',
      user: {
        id: user.id,
        instagramUsername: user.instagramUsername,
        instagramUserId: user.instagramUserId,
      },
    });
  } catch (error) {
    logger.error('Instagram credentials update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/auth/posting-settings
// @desc    Update posting settings
// @access  Private
router.put('/posting-settings', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const {
      autoPostingEnabled,
      postingTimes,
      pinnedHours,
      excludedHours,
      timezone,
      testMode,
    } = req.body;

    const user = await userModel.updatePostingSettings(decoded.userId, {
      autoPostingEnabled,
      postingTimes,
      pinnedHours,
      excludedHours,
      timezone,
      testMode,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Posting settings updated for user: ${user.email}`);

    res.json({
      message: 'Posting settings updated successfully',
      settings: {
        autoPostingEnabled: user.autoPostingEnabled,
        postingTimes: user.postingTimes,
        pinnedHours: user.pinnedHours,
        excludedHours: user.excludedHours,
        timezone: user.timezone,
        testMode: user.testMode,
      },
    });
  } catch (error) {
    logger.error('Posting settings update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from storage
    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 