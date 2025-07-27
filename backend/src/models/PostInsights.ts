import mongoose, { Schema, Document } from 'mongoose';

export interface IPostInsight extends Document {
  platform: 'youtube' | 'instagram';
  videoId: string;
  caption: string;
  hashtags: string[];
  performanceScore: number;
  repostEligible: boolean;
  reposted: boolean;
  repostedAt?: Date;
  originalPostDate: Date;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  title?: string;
  scrapedAt: Date;
}

const PostInsightSchema: Schema = new Schema({
  platform: {
    type: String,
    enum: ['youtube', 'instagram'],
    required: true
  },
  videoId: {
    type: String,
    required: true,
    unique: true
  },
  caption: {
    type: String,
    required: false,
    default: ''
  },
  hashtags: [{
    type: String
  }],
  performanceScore: {
    type: Number,
    required: true,
    default: 0
  },
  repostEligible: {
    type: Boolean,
    default: true
  },
  reposted: {
    type: Boolean,
    default: false
  },
  repostedAt: {
    type: Date
  },
  originalPostDate: {
    type: Date,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  title: {
    type: String
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
PostInsightSchema.index({ platform: 1, performanceScore: -1 });
PostInsightSchema.index({ repostEligible: 1, reposted: 1 });

export default mongoose.model<IPostInsight>('PostInsight', PostInsightSchema); 