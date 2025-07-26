import mongoose, { Schema, Document } from 'mongoose';

export interface ITopHashtag extends Document {
  hashtag: string;
  usageCount: number;
  avgViewScore: number;
  platform: 'youtube' | 'instagram' | 'both';
  totalViews: number;
  totalLikes: number;
  lastUpdated: Date;
}

const TopHashtagSchema: Schema = new Schema({
  hashtag: {
    type: String,
    required: true,
    unique: true
  },
  usageCount: {
    type: Number,
    required: true,
    default: 0
  },
  avgViewScore: {
    type: Number,
    required: true,
    default: 0
  },
  platform: {
    type: String,
    enum: ['youtube', 'instagram', 'both'],
    default: 'both'
  },
  totalViews: {
    type: Number,
    default: 0
  },
  totalLikes: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
TopHashtagSchema.index({ avgViewScore: -1 });
TopHashtagSchema.index({ usageCount: -1 });
TopHashtagSchema.index({ platform: 1, avgViewScore: -1 });

export default mongoose.model<ITopHashtag>('TopHashtag', TopHashtagSchema); 