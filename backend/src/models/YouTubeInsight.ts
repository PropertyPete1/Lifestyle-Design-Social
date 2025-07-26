import mongoose, { Schema, Document } from 'mongoose';

export interface IYouTubeInsight extends Document {
  tag: string;
  appearances: number;
  avgViewCount: number;
  trendingKeywords?: string[]; // New field for Phase 4 SEO keywords
  createdAt?: Date;
  updatedAt?: Date;
}

const YouTubeInsightSchema: Schema = new Schema({
  tag: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  appearances: {
    type: Number,
    required: true,
    default: 1
  },
  avgViewCount: {
    type: Number,
    required: true,
    default: 0
  },
  trendingKeywords: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Create indexes for performance
YouTubeInsightSchema.index({ avgViewCount: -1 });
YouTubeInsightSchema.index({ appearances: -1 });

export default mongoose.model<IYouTubeInsight>('YouTubeInsight', YouTubeInsightSchema); 