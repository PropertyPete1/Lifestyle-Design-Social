import mongoose, { Schema, Document } from 'mongoose';

export interface IYouTubeVideo extends Document {
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  alreadyPosted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const YouTubeVideoSchema: Schema = new Schema({
  videoId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: String,
    required: true
  },
  alreadyPosted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for performance
YouTubeVideoSchema.index({ viewCount: -1 });
YouTubeVideoSchema.index({ publishedAt: -1 });
YouTubeVideoSchema.index({ alreadyPosted: 1 });

export default mongoose.model<IYouTubeVideo>('YouTubeVideo', YouTubeVideoSchema); 