import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    email: string;
    name: string;
    password: string;
    username?: string;
    instagramAccessToken?: string;
    instagramRefreshToken?: string;
    instagramUserId?: string;
    tiktokAccessToken?: string;
    tiktokUserId?: string;
    youtubeAccessToken?: string;
    youtubeRefreshToken?: string;
    youtubeChannelId?: string;
    autoPostingEnabled: boolean;
    postingTimes: string[];
    pinnedHours?: string[];
    excludedHours?: string[];
    timezone: string;
    testMode: boolean;
    lastLoginAt?: Date;
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
    twoFactorSetupAt?: Date;
    backupCodes?: string[];
    watermarkEnabled?: boolean;
    watermarkLogoPath?: string;
    watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    watermarkOpacity?: number;
    watermarkSizePercent?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & {
    _id: mongoose.Types.ObjectId;
}, any>;
export declare const UserModel: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & {
    _id: mongoose.Types.ObjectId;
}, any>;
export interface UserCreateInput {
    email: string;
    name: string;
    password: string;
    timezone?: string;
}
export interface UserUpdateInput {
    name?: string;
    username?: string;
    instagramAccessToken?: string;
    instagramRefreshToken?: string;
    instagramUserId?: string;
    autoPostingEnabled?: boolean;
    postingTimes?: string[];
    pinnedHours?: string[];
    excludedHours?: string[];
    timezone?: string;
    testMode?: boolean;
}
//# sourceMappingURL=User.d.ts.map