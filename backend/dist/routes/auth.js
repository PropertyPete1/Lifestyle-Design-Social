"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const User_1 = require("../models/User");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const userModel = new User_1.UserModel(database_1.pool);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const validateRegistration = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
];
const validateLogin = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty(),
];
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { email, name, password } = req.body;
        const existingUser = await userModel.findByEmail(email);
        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }
        const saltRounds = 12;
        const passwordHash = await bcryptjs_1.default.hash(password, saltRounds);
        const user = await userModel.create({
            email,
            name,
            password: passwordHash,
        });
        const token = generateToken(user.id);
        logger_1.logger.info(`New user registered: ${email}`);
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
        return;
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
        return;
    }
});
router.post('/login', validateLogin, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { email, password } = req.body;
        const user = await userModel.findByEmail(email);
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        await userModel.updateLastLogin(user.id);
        const token = generateToken(user.id);
        logger_1.logger.info(`User logged in: ${email}`);
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
        return;
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
        return;
    }
});
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await userModel.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ error: 'Invalid token' });
            return;
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
        return;
    }
    catch (error) {
        logger_1.logger.error('Get user error:', error);
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
});
router.put('/instagram', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const { instagramUsername, instagramAccessToken, instagramRefreshToken, instagramUserId } = req.body;
        const user = await userModel.updateInstagramCredentials(decoded.userId, {
            instagramUsername,
            instagramAccessToken,
            instagramRefreshToken,
            instagramUserId,
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        logger_1.logger.info(`Instagram credentials updated for user: ${user.email}`);
        res.json({
            message: 'Instagram credentials updated successfully',
            user: {
                id: user.id,
                instagramUsername: user.instagramUsername,
                instagramUserId: user.instagramUserId,
            },
        });
        return;
    }
    catch (error) {
        logger_1.logger.error('Instagram credentials update error:', error);
        res.status(500).json({ error: 'Server error' });
        return;
    }
});
router.put('/posting-settings', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const { autoPostingEnabled, postingTimes, pinnedHours, excludedHours, timezone, testMode, } = req.body;
        const user = await userModel.updatePostingSettings(decoded.userId, {
            autoPostingEnabled,
            postingTimes,
            pinnedHours,
            excludedHours,
            timezone,
            testMode,
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        logger_1.logger.info(`Posting settings updated for user: ${user.email}`);
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
        return;
    }
    catch (error) {
        logger_1.logger.error('Posting settings update error:', error);
        res.status(500).json({ error: 'Server error' });
        return;
    }
});
router.post('/logout', async (req, res) => {
    try {
        res.json({ message: 'Logout successful' });
    }
    catch (error) {
        logger_1.logger.error('Logout error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map