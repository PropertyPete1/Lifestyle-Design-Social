import mongoose, { Schema, Document } from 'mongoose';

export interface IAudioMatch extends Document {
  videoId: string;
  matchedAudio: string;
  matchedAt: Date;
  platform: 'youtube' | 'instagram';
  audioMetadata: {
    title: string;
    artist?: string;
    duration?: number;
    trending_rank?: number;
    platform_audio_id: string;
    category?: string;
  };
  matchingFactors: {
    topicMatch: number;
    keywordMatch: number;
    categoryMatch: number;
    overallScore: number;
  };
  status: 'matched' | 'applied' | 'failed';
  errorMessage?: string;
}

const AudioMatchSchema = new Schema<IAudioMatch>({
  videoId: { 
    type: String, 
    required: true, 
    index: true 
  },
  matchedAudio: { 
    type: String, 
    required: true 
  },
  matchedAt: { 
    type: Date, 
    default: Date.now 
  },
  platform: { 
    type: String, 
    enum: ['youtube', 'instagram'], 
    required: true 
  },
  audioMetadata: {
    title: { type: String, required: true },
    artist: { type: String },
    duration: { type: Number },
    trending_rank: { type: Number },
    platform_audio_id: { type: String, required: true },
    category: { type: String }
  },
  matchingFactors: {
    topicMatch: { type: Number, min: 0, max: 100 },
    keywordMatch: { type: Number, min: 0, max: 100 },
    categoryMatch: { type: Number, min: 0, max: 100 },
    overallScore: { type: Number, min: 0, max: 100 }
  },
  status: { 
    type: String, 
    enum: ['matched', 'applied', 'failed'], 
    default: 'matched' 
  },
  errorMessage: { type: String }
});

// Add indexes for efficient queries
AudioMatchSchema.index({ videoId: 1, platform: 1 });
AudioMatchSchema.index({ matchedAt: -1 });
AudioMatchSchema.index({ status: 1 });
AudioMatchSchema.index({ 'matchingFactors.overallScore': -1 });

export const AudioMatch = mongoose.model<IAudioMatch>('AudioMatch', AudioMatchSchema); 