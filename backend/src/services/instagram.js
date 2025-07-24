"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchInstagramPosts = fetchInstagramPosts;
exports.fetchInstagramInsights = fetchInstagramInsights;
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const settingsPath = path_1.default.resolve(__dirname, '../../../frontend/settings.json');
let accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
let businessId = process.env.INSTAGRAM_BUSINESS_ID || '';
if ((!accessToken || !businessId) && fs_1.default.existsSync(settingsPath)) {
    try {
        const settings = JSON.parse(fs_1.default.readFileSync(settingsPath, 'utf-8'));
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
function fetchInstagramPosts() {
    return __awaiter(this, arguments, void 0, function* (limit = 100) {
        const url = `${BASE_URL}/${businessId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}&limit=${limit}`;
        const res = yield (0, node_fetch_1.default)(url);
        if (!res.ok) {
            const errorText = yield res.text();
            console.error('Instagram API error:', res.status, errorText);
            throw new Error(`Failed to fetch Instagram posts: ${res.statusText} - ${errorText}`);
        }
        const data = yield res.json();
        return data && typeof data === 'object' && 'data' in data ? data.data : [];
    });
}
function fetchInstagramInsights(mediaId) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${BASE_URL}/${mediaId}/insights?metric=impressions,reach,engagement,saved,video_views&access_token=${accessToken}`;
        const res = yield (0, node_fetch_1.default)(url);
        if (!res.ok)
            throw new Error(`Failed to fetch insights for ${mediaId}: ${res.statusText}`);
        const data = yield res.json();
        return data && typeof data === 'object' && 'data' in data ? data.data : [];
    });
}
