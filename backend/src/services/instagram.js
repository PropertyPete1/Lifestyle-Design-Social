"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchInstagramPosts = fetchInstagramPosts;
exports.fetchInstagramInsights = fetchInstagramInsights;
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const settingsPath = path.resolve(__dirname, '../../../frontend/settings.json');
let accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
let businessId = process.env.INSTAGRAM_BUSINESS_ID || '';
if ((!accessToken || !businessId) && fs.existsSync(settingsPath)) {
    try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        accessToken = accessToken || settings.instagramAccessToken || '';
        businessId = businessId || settings.instagramBusinessId || '';
    }
    catch (e) {
        console.error('Failed to read Instagram credentials from settings.json:', e);
    }
}
if (!accessToken || !businessId) {
    throw new Error('Instagram access token or business ID not set in environment or settings.json');
}
const BASE_URL = 'https://graph.facebook.com/v19.0';
async function fetchInstagramPosts(limit = 100) {
    const url = `${BASE_URL}/${businessId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}&limit=${limit}`;
    const res = await (0, node_fetch_1.default)(url);
    if (!res.ok) {
        const errorText = await res.text();
        console.error('Instagram API error:', res.status, errorText);
        throw new Error(`Failed to fetch Instagram posts: ${res.statusText} - ${errorText}`);
    }
    const data = await res.json();
    return data && typeof data === 'object' && 'data' in data ? data.data : [];
}
async function fetchInstagramInsights(mediaId) {
    const url = `${BASE_URL}/${mediaId}/insights?metric=impressions,reach,engagement,saved,video_views&access_token=${accessToken}`;
    const res = await (0, node_fetch_1.default)(url);
    if (!res.ok)
        throw new Error(`Failed to fetch insights for ${mediaId}: ${res.statusText}`);
    const data = await res.json();
    return data && typeof data === 'object' && 'data' in data ? data.data : [];
}
