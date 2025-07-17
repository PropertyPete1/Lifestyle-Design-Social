"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = require("../utils/logger");
const User_1 = require("../models/User");
const database_1 = require("../config/database");
const router = express_1.default.Router();
router.get('/instagram', async (_req, res) => {
    try {
        const clientId = process.env.INSTAGRAM_CLIENT_ID;
        const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3001/api/oauth/instagram/callback';
        if (!clientId) {
            return res.status(500).json({
                success: false,
                error: 'Instagram OAuth not configured'
            });
        }
        const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code`;
        return res.json({
            success: true,
            authUrl
        });
    }
    catch (error) {
        logger_1.logger.error('Instagram OAuth error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to start Instagram OAuth flow'
        });
    }
});
router.get('/instagram/callback', async (req, res) => {
    try {
        const { code, error } = req.query;
        const userId = req.user?.id;
        if (error) {
            return res.status(400).json({
                success: false,
                error: `Instagram OAuth error: ${error}`
            });
        }
        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'No authorization code received'
            });
        }
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const clientId = process.env.INSTAGRAM_CLIENT_ID;
        const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            return res.status(500).json({
                success: false,
                error: 'Instagram OAuth credentials not configured'
            });
        }
        const mockAccessToken = `mock_token_${Date.now()}`;
        const mockInstagramUserId = `mock_user_${Date.now()}`;
        await (0, database_1.connectToDatabase)();
        const updatedUser = await User_1.User.findByIdAndUpdate(userId, {
            instagramAccessToken: mockAccessToken,
            instagramUserId: mockInstagramUserId,
            updatedAt: new Date()
        }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        return res.json({
            success: true,
            message: 'Instagram account connected successfully',
            data: {
                instagramUserId: mockInstagramUserId,
                connected: true
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Instagram OAuth callback error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to complete Instagram OAuth'
        });
    }
});
router.delete('/instagram', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        await (0, database_1.connectToDatabase)();
        const updatedUser = await User_1.User.findByIdAndUpdate(userId, {
            $unset: {
                instagramAccessToken: 1,
                instagramUserId: 1,
                instagramRefreshToken: 1
            },
            updatedAt: new Date()
        }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        return res.json({
            success: true,
            message: 'Instagram account disconnected successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Instagram disconnect error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to disconnect Instagram account'
        });
    }
});
exports.default = router;
