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
exports.postToInstagram = postToInstagram;
const axios_1 = __importDefault(require("axios"));
const Sentry = __importStar(require("@sentry/node"));
const tokenManager_1 = require("../auth/tokenManager");
async function postToInstagram(videoUrl, caption) {
    try {
        const accessToken = await (0, tokenManager_1.getInstagramToken)();
        const userId = await (0, tokenManager_1.getInstagramUserId)();
        const containerRes = await axios_1.default.post(`https://graph.facebook.com/v18.0/${userId}/media`, {
            media_type: "REEL",
            video_url: videoUrl,
            caption,
            share_to_feed: true,
        }, {
            params: { access_token: accessToken },
        });
        const creationId = containerRes.data.id;
        const publishRes = await axios_1.default.post(`https://graph.facebook.com/v18.0/${userId}/media_publish`, {
            creation_id: creationId,
        }, {
            params: { access_token: accessToken },
        });
        return { success: true };
    }
    catch (error) {
        console.error("Instagram publish error:", error.response?.data || error.message);
        Sentry.captureException(error);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message || "Unknown error",
        };
    }
}
//# sourceMappingURL=instagramPublisher.js.map