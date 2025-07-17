import mongoose, { Schema, Document } from 'mongoose';

export interface IUserInsights extends Document {
  userId: string;
  insightsData: {
    bestPerformingHours: number[];
    topHashtags: string[];
    bestCaptionPatterns: string[];
    optimalCaptionLength: { min: number; max: number };
    highEngagementWords: string[];
    callToActionPatterns: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const userInsightsSchema = new Schema<IUserInsights>({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  insightsData: {
    bestPerformingHours: [{
      type: Number,
      min: 0,
      max: 23
    }],
    topHashtags: [String],
    bestCaptionPatterns: [String],
    optimalCaptionLength: {
      min: { type: Number, default: 100 },
      max: { type: Number, default: 300 }
    },
    highEngagementWords: [String],
    callToActionPatterns: [String]
  }
}, {
  timestamps: true
});

// Create indexes
userInsightsSchema.index({ userId: 1 }, { unique: true });
userInsightsSchema.index({ updatedAt: -1 });

export const UserInsights = mongoose.model<IUserInsights>('UserInsights', userInsightsSchema); 