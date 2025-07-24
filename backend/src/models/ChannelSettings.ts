import mongoose, { Schema, Document } from 'mongoose';

export interface IChannelSettings extends Document {
  settingKey: string;
  settingValue: string;
  lastUsed?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChannelSettingsSchema: Schema = new Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  settingValue: {
    type: String,
    required: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// PART 4: Auto-save and retrieve YouTube Channel ID
export async function saveChannelId(channelId: string): Promise<void> {
  try {
    await mongoose.model<IChannelSettings>('ChannelSettings', ChannelSettingsSchema)
      .findOneAndUpdate(
        { settingKey: 'youtube_channel_id' },
        { 
          settingValue: channelId,
          lastUsed: new Date()
        },
        { upsert: true, new: true }
      );
    
    console.log(`✅ Auto-saved YouTube Channel ID: ${channelId}`);
  } catch (error) {
    console.error('❌ Error saving channel ID:', error);
  }
}

export async function getChannelId(): Promise<string | null> {
  try {
    const setting = await mongoose.model<IChannelSettings>('ChannelSettings', ChannelSettingsSchema)
      .findOne({ settingKey: 'youtube_channel_id' });
    
    if (setting) {
      // Update last used timestamp
      setting.lastUsed = new Date();
      await setting.save();
      
      console.log(`✅ Retrieved saved YouTube Channel ID: ${setting.settingValue}`);
      return setting.settingValue;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error retrieving channel ID:', error);
    return null;
  }
}

export default mongoose.model<IChannelSettings>('ChannelSettings', ChannelSettingsSchema); 