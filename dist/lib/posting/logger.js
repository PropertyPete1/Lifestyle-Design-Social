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
exports.logPostSuccess = logPostSuccess;
exports.logPostFailure = logPostFailure;
exports.logCaptionResult = logCaptionResult;
exports.logSimplePostSuccess = logSimplePostSuccess;
exports.logSimplePostFailure = logSimplePostFailure;
const mongoClient_1 = require("../db/mongoClient");
const captionStorage_1 = require("../db/captionStorage");
const Sentry = __importStar(require("@sentry/node"));
async function logPostSuccess(video, caption, type) {
    return mongoClient_1.db.collection("post_logs").insertOne({
        type,
        videoId: video.id,
        caption,
        timestamp: new Date(),
        status: "success",
    });
}
async function logPostFailure(video, error) {
    return mongoClient_1.db.collection("post_logs").insertOne({
        type: video.type,
        videoId: video.id,
        timestamp: new Date(),
        status: "failed",
        error,
    });
}
async function logCaptionResult(caption, hashtags, views) {
    const engagement = views;
    await (0, captionStorage_1.storeCaption)(caption, engagement, hashtags);
}
function logSimplePostSuccess(videoId) {
    console.log(`✅ Post succeeded for video ${videoId}`);
}
function logSimplePostFailure(videoId, reason) {
    console.error(`❌ Post failed for video ${videoId}: ${reason}`);
    Sentry.captureMessage(`Instagram post failed: ${videoId} - ${reason}`, 'error');
}
//# sourceMappingURL=logger.js.map