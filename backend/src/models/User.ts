import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  username?: string;
  company?: string;
  instagramAccessToken?: string;
  instagramRefreshToken?: string;
  instagramUserId?: string;
  tiktokAccessToken?: string;
  tiktokUserId?: string;
  youtubeAccessToken?: string;
  youtubeRefreshToken?: string;
  youtubeChannelId?: string;
  socialMediaTokens?: {
    instagram?: {
      accessToken: string;
      refreshToken?: string;
      expiresIn?: number;
      connectedAt?: Date;
    };
    youtube?: {
      accessToken: string;
      refreshToken?: string;
      expiresIn?: number;
      connectedAt?: Date;
    };
    tiktok?: {
      accessToken: string;
      refreshToken?: string;
      expiresIn?: number;
      connectedAt?: Date;
    };
  };
  platforms?: {
    instagram?: {
      connected: boolean;
      connectedAt?: Date;
    };
    youtube?: {
      connected: boolean;
      connectedAt?: Date;
    };
    tiktok?: {
      connected: boolean;
      connectedAt?: Date;
    };
  };
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

const userSchema = new Schema<IUser>({
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
    sparse: true // Allow multiple documents without username
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

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export const User = mongoose.model<IUser>('User', userSchema);

// Export model alias for service compatibility
export const UserModel = User;

// Export interface for backward compatibility
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