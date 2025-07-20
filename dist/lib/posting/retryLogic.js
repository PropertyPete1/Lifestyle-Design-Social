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
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryPost = retryPost;
exports.tryPostingWithRetries = tryPostingWithRetries;
const instagramPublisher_1 = require("./instagramPublisher");
const Sentry = __importStar(require("@sentry/node"));
const MAX_RETRIES = 3;
async function retryPost(video, caption, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        const result = await (0, instagramPublisher_1.postToInstagram)(video.url, caption);
        if (result.success)
            return result;
        await new Promise((r) => setTimeout(r, 1500));
    }
    return { success: false, error: "Max retries reached." };
}
async function tryPostingWithRetries(videoId, caption, fileUrl) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await (0, instagramPublisher_1.postToInstagram)(fileUrl, caption);
            if (result.success)
                return true;
        }
        catch (err) {
            console.error(`Attempt ${attempt} failed for video ${videoId}:`, err);
        }
    }
    Sentry.captureException(new Error(`All retries failed for video ${videoId}`));
    return false;
}
//# sourceMappingURL=retryLogic.js.map