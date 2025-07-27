import mongoose, { Schema, Document } from 'mongoose';

export interface IPeakEngagementTimes extends Document {
  platform: 'youtube' | 'instagram';
  dayOfWeek: string;
  hour: number;
  avgScore: number;
  totalPosts: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PeakEngagementTimesSchema: Schema = new Schema({
  platform: {
    type: String,
    required: true,
    enum: ['youtube', 'instagram']
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },
  avgScore: {
    type: Number,
    required: true,
    default: 0
  },
  totalPosts: {
    type: Number,
    required: true,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
PeakEngagementTimesSchema.index({ platform: 1, dayOfWeek: 1, hour: 1 }, { unique: true });

export default mongoose.model<IPeakEngagementTimes>('PeakEngagementTimes', PeakEngagementTimesSchema); 