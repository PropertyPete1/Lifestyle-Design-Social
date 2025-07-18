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
exports.UserModel = exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        trim: true,
        sparse: true
    },
    company: {
        type: String,
        trim: true
    },
    instagramAccessToken: String,
    instagramRefreshToken: String,
    instagramUserId: String,
    tiktokAccessToken: String,
    tiktokUserId: String,
    youtubeAccessToken: String,
    youtubeRefreshToken: String,
    youtubeChannelId: String,
    autoPostingEnabled: {
        type: Boolean,
        default: false
    },
    postingTimes: {
        type: [String],
        default: ['09:00', '13:00', '18:00']
    },
    pinnedHours: [String],
    excludedHours: [String],
    timezone: {
        type: String,
        default: 'UTC'
    },
    testMode: {
        type: Boolean,
        default: false
    },
    lastLoginAt: Date,
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,
    twoFactorSetupAt: Date,
    backupCodes: [String],
    watermarkEnabled: {
        type: Boolean,
        default: false
    },
    watermarkLogoPath: String,
    watermarkPosition: {
        type: String,
        enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'],
        default: 'bottom-right'
    },
    watermarkOpacity: {
        type: Number,
        min: 0.1,
        max: 1.0,
        default: 0.70
    },
    watermarkSizePercent: {
        type: Number,
        min: 5.0,
        max: 50.0,
        default: 10.0
    }
}, {
    timestamps: true
});
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
exports.User = mongoose_1.default.model('User', userSchema);
exports.UserModel = exports.User;
