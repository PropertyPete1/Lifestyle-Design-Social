"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = require("../utils/logger");
const User_1 = require("../models/User");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const userModel = new User_1.UserModel(database_1.pool);
router.get('/instagram/auth', auth_1.authenticateToken, (req, res) => {
    const clientId = process.env['INSTAGRAM_APP_ID'];
    const redirectUri = process.env['INSTAGRAM_REDIRECT_URI'] || 'http://localhost:3000/oauth/instagram/callback';
    const scope = 'user_profile,user_media';
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    res.json({ authUrl });
});
router.get('/instagram/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        const userId = state;
        if (!code || !userId) {
            res.status(400).json({ error: 'Missing authorization code or user ID' });
            return;
        }
        const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env['INSTAGRAM_APP_ID'] || '',
                client_secret: process.env['INSTAGRAM_APP_SECRET'] || '',
                grant_type: 'authorization_code',
                redirect_uri: process.env['INSTAGRAM_REDIRECT_URI'] || 'http://localhost:3000/oauth/instagram/callback',
                code: code,
            }),
        });
        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            logger_1.logger.error('Instagram OAuth error:', tokenData.error);
            res.status(400).json({ error: 'Failed to get Instagram access token' });
            return;
        }
        await userModel.updateSocialTokens(userId, {
            instagramAccessToken: tokenData.access_token,
            instagramUserId: tokenData.user_id,
        });
        logger_1.logger.info(`Instagram OAuth successful for user ${userId}`);
        res.json({ success: true, message: 'Instagram connected successfully' });
    }
    catch (error) {
        logger_1.logger.error('Instagram OAuth callback error:', error);
        res.status(500).json({ error: 'Instagram authentication failed' });
    }
});
router.get('/tiktok/auth', auth_1.authenticateToken, (req, res) => {
    const clientKey = process.env['TIKTOK_CLIENT_KEY'];
    const redirectUri = process.env['TIKTOK_REDIRECT_URI'] || 'http://localhost:3000/oauth/tiktok/callback';
    const scope = 'user.info.basic,video.list';
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&state=${req.user?.id}`;
    res.json({ authUrl });
});
router.get('/tiktok/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        const userId = state;
        if (!code || !userId) {
            res.status(400).json({ error: 'Missing authorization code or user ID' });
            return;
        }
        const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: process.env['TIKTOK_CLIENT_KEY'] || '',
                client_secret: process.env['TIKTOK_CLIENT_SECRET'] || '',
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: process.env['TIKTOK_REDIRECT_URI'] || 'http://localhost:3000/oauth/tiktok/callback',
            }),
        });
        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            logger_1.logger.error('TikTok OAuth error:', tokenData.error);
            res.status(400).json({ error: 'Failed to get TikTok access token' });
            return;
        }
        await userModel.updateSocialTokens(userId, {
            tiktokAccessToken: tokenData.access_token,
            tiktokUserId: tokenData.open_id,
        });
        logger_1.logger.info(`TikTok OAuth successful for user ${userId}`);
        res.json({ success: true, message: 'TikTok connected successfully' });
    }
    catch (error) {
        logger_1.logger.error('TikTok OAuth callback error:', error);
        res.status(500).json({ error: 'TikTok authentication failed' });
    }
});
router.get('/youtube/auth', auth_1.authenticateToken, (req, res) => {
    const clientId = process.env['YOUTUBE_CLIENT_ID'];
    const redirectUri = process.env['YOUTUBE_REDIRECT_URI'] || 'http://localhost:3000/oauth/youtube/callback';
    const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${req.user?.id}&access_type=offline`;
    res.json({ authUrl });
});
router.get('/youtube/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        const userId = state;
        if (!code || !userId) {
            res.status(400).json({ error: 'Missing authorization code or user ID' });
            return;
        }
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env['YOUTUBE_CLIENT_ID'] || '',
                client_secret: process.env['YOUTUBE_CLIENT_SECRET'] || '',
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: process.env['YOUTUBE_REDIRECT_URI'] || 'http://localhost:3000/oauth/youtube/callback',
            }),
        });
        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            logger_1.logger.error('YouTube OAuth error:', tokenData.error);
            res.status(400).json({ error: 'Failed to get YouTube access token' });
            return;
        }
        const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${tokenData.access_token}`);
        const channelData = await channelResponse.json();
        await userModel.updateSocialTokens(userId, {
            youtubeAccessToken: tokenData.access_token,
            youtubeRefreshToken: tokenData.refresh_token,
            youtubeChannelId: channelData.items?.[0]?.id,
        });
        logger_1.logger.info(`YouTube OAuth successful for user ${userId}`);
        res.json({ success: true, message: 'YouTube connected successfully' });
    }
    catch (error) {
        logger_1.logger.error('YouTube OAuth callback error:', error);
        res.status(500).json({ error: 'YouTube authentication failed' });
    }
});
router.post('/disconnect/:platform', auth_1.authenticateToken, async (req, res) => {
    try {
        const { platform } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const updateData = {};
        switch (platform) {
            case 'instagram':
                updateData.instagramAccessToken = null;
                updateData.instagramUserId = null;
                break;
            case 'tiktok':
                updateData.tiktokAccessToken = null;
                updateData.tiktokUserId = null;
                break;
            case 'youtube':
                updateData.youtubeAccessToken = null;
                updateData.youtubeRefreshToken = null;
                updateData.youtubeChannelId = null;
                break;
            default:
                res.status(400).json({ error: 'Invalid platform' });
                return;
        }
        await userModel.updateSocialTokens(userId, updateData);
        logger_1.logger.info(`Disconnected ${platform} for user ${userId}`);
        res.json({ success: true, message: `${platform} disconnected successfully` });
    }
    catch (error) {
        logger_1.logger.error('Disconnect social account error:', error);
        res.status(500).json({ error: 'Failed to disconnect account' });
    }
});
router.get('/connected', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const user = await userModel.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const connectedAccounts = {
            instagram: !!user.instagramAccessToken,
            tiktok: !!user.tiktokAccessToken,
            youtube: !!user.youtubeAccessToken,
        };
        res.json({ connectedAccounts });
    }
    catch (error) {
        logger_1.logger.error('Get connected accounts error:', error);
        res.status(500).json({ error: 'Failed to get connected accounts' });
    }
});
router.post('/refresh/:platform', auth_1.authenticateToken, async (req, res) => {
    try {
        const { platform } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const user = await userModel.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        switch (platform) {
            case 'instagram':
                res.json({ success: true, message: 'Instagram tokens are long-lived' });
                return;
            case 'tiktok':
                res.json({ success: true, message: 'TikTok token refresh not implemented yet' });
                return;
            case 'youtube':
                if (!user.youtubeRefreshToken) {
                    res.status(400).json({ error: 'No refresh token available' });
                    return;
                }
                const response = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: process.env['YOUTUBE_CLIENT_ID'] || '',
                        client_secret: process.env['YOUTUBE_CLIENT_SECRET'] || '',
                        refresh_token: user.youtubeRefreshToken,
                        grant_type: 'refresh_token',
                    }),
                });
                const tokenData = await response.json();
                if (tokenData.error) {
                    res.status(400).json({ error: 'Failed to refresh YouTube token' });
                    return;
                }
                await userModel.updateSocialTokens(userId, {
                    youtubeAccessToken: tokenData.access_token,
                });
                logger_1.logger.info(`Refreshed ${platform} token for user ${userId}`);
                res.json({ success: true, message: `${platform} token refreshed successfully` });
                return;
            default:
                res.status(400).json({ error: 'Invalid platform' });
                return;
        }
    }
    catch (error) {
        logger_1.logger.error('Refresh token error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});
exports.default = router;
//# sourceMappingURL=oauth.js.map