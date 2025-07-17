"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const User_1 = require("../models/User");
const database_1 = require("../config/database");
const router = express_1.default.Router();
router.post('/register', async (req, res) => {
    try {
        await (0, database_1.connectToDatabase)();
        const { username, email, password, name } = req.body;
        if (!username || !email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: 'Username, email, password, and name are required'
            });
        }
        const existingUser = await User_1.User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists'
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = new User_1.User({
            username,
            name,
            email,
            password: hashedPassword
        });
        await user.save();
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is required for production');
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username }, jwtSecret, { expiresIn: '24h' });
        return res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            error: 'Registration failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/login', async (req, res) => {
    try {
        await (0, database_1.connectToDatabase)();
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is required for production');
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username }, jwtSecret, { expiresIn: '24h' });
        return res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});
router.get('/me', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }
        await (0, database_1.connectToDatabase)();
        const user = await User_1.User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        return res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get user error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get user data'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map