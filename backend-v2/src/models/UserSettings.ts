import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: string;
  
  // Core API Credentials
  instagramToken?: string;
  instagramAccountId?: string;
  facebookPageId?: string;
  youtubeToken?: string;
  youtubeRefreshToken?: string;
  youtubeChannelId?: string;
  dropboxToken?: string;
  mongodbUri?: string;
  
  // Optional API Credentials
  runwayApiKey?: string;
  openaiApiKey?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  s3Bucket?: string;
  s3Region?: string;
  
  // Operation Modes
  autopilotEnabled: boolean;
  manualMode: boolean;
  
  // Scheduler Settings
  postTime: string;
  peakHoursEnabled: boolean;
  maxPostsPerDay: number;
  repostDelayDays: number;
  
  // App Visuals & Features
  thumbnailMode: 'first' | 'best' | 'manual';
  editorStyle: 'simple' | 'advanced';
  cartoonEnabled: boolean;
  postToInstagram: boolean;
  postToYouTube: boolean;
  crossPostEnabled: boolean;
  
  // Storage Settings
  dropboxFolder: string;
  fileRetentionDays: number;
  
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSettingsSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: 'default_user' // Single user system for now
  },
  
  // Core API Credentials
  instagramToken: { type: String, default: '' },
  instagramAccountId: { type: String, default: '' },
  facebookPageId: { type: String, default: '' },
  youtubeToken: { type: String, default: '' },
  youtubeRefreshToken: { type: String, default: '' },
  youtubeChannelId: { type: String, default: '' },
  dropboxToken: { type: String, default: '' },
  mongodbUri: { type: String, default: '' },
  
  // Optional API Credentials
  runwayApiKey: { type: String, default: '' },
  openaiApiKey: { type: String, default: '' },
  s3AccessKey: { type: String, default: '' },
  s3SecretKey: { type: String, default: '' },
  s3Bucket: { type: String, default: '' },
  s3Region: { type: String, default: '' },
  
  // Operation Modes
  autopilotEnabled: { type: Boolean, default: false },
  manualMode: { type: Boolean, default: true },
  
  // Scheduler Settings
  postTime: { type: String, default: '14:00' },
  peakHoursEnabled: { type: Boolean, default: true },
  maxPostsPerDay: { type: Number, default: 5 },
  repostDelayDays: { type: Number, default: 1 },
  
  // App Visuals & Features
  thumbnailMode: { 
    type: String, 
    enum: ['first', 'best', 'manual'], 
    default: 'first' 
  },
  editorStyle: { 
    type: String, 
    enum: ['simple', 'advanced'], 
    default: 'simple' 
  },
  cartoonEnabled: { type: Boolean, default: true },
  postToInstagram: { type: Boolean, default: true },
  postToYouTube: { type: Boolean, default: true },
  crossPostEnabled: { type: Boolean, default: true },
  
  // Storage Settings
  dropboxFolder: { type: String, default: '/Bulk Upload' },
  fileRetentionDays: { type: Number, default: 7 }
}, {
  timestamps: true
});

// Helper functions for user settings
export async function getUserSettings(userId: string = 'default_user'): Promise<IUserSettings> {
  try {
    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      // Create default settings if none exist
      settings = new UserSettings({ userId });
      await settings.save();
      console.log(`✅ Created default settings for user: ${userId}`);
    }
    
    return settings;
  } catch (error) {
    console.error('❌ Error retrieving user settings:', error);
    throw error;
  }
}

export async function updateUserSettings(userId: string = 'default_user', updates: Partial<IUserSettings>): Promise<IUserSettings> {
  try {
    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      { ...updates, userId }, // Ensure userId is preserved
      { upsert: true, new: true }
    );
    
    console.log(`✅ Updated settings for user: ${userId}`);
    return settings;
  } catch (error) {
    console.error('❌ Error updating user settings:', error);
    throw error;
  }
}

const UserSettings = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
export default UserSettings;