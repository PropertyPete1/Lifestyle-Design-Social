import mongoose, { Schema, Document } from 'mongoose';

export interface ITopHashtag extends Document {
  hashtag: string;
  usageCount: number;
  avgViewScore: number;
  platform: 'youtube' | 'instagram';
  totalViews: number;
  totalLikes: number;
  lastUpdated: Date;
}

const TopHashtagSchema: Schema = new Schema({
  hashtag: {
    type: String,
    required: true
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
    enum: ['youtube', 'instagram'],
    required: true
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

// Compound unique index to allow same hashtag on different platforms
TopHashtagSchema.index({ hashtag: 1, platform: 1 }, { unique: true });

export default mongoose.model<ITopHashtag>('TopHashtag', TopHashtagSchema); 