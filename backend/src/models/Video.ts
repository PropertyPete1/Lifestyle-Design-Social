import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo extends Document {
  userId: string;
  title: string;
  description?: string;
  filename: string;
  filePath: string;
  fileSize: number;
  duration?: number;
  resolution?: string;
  thumbnailPath?: string;
  hasAudio: boolean;
  category: 'real-estate' | 'cartoon';
  propertyType?: string;
  location?: string;
  price?: number;
  tags: string[];
  aiScore?: number;
  postCount: number;
  lastPostedAt?: Date;
  nextPostDate?: Date;
  isActive: boolean;
  preferredCaption?: string;
  preferredHashtags?: string[];
  preferredMusic?: string;
  coolOffDays: number; // Days before video can be reposted
  starred: boolean; // Whether video is starred for priority posting
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  filename: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  duration: Number,
  resolution: String,
  thumbnailPath: String,
  hasAudio: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['real-estate', 'cartoon'],
    required: true
  },
  propertyType: String,
  location: String,
  price: Number,
  tags: [String],
  aiScore: Number,
  postCount: {
    type: Number,
    default: 0
  },
  lastPostedAt: Date,
  nextPostDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  preferredCaption: String,
  preferredHashtags: [String],
  preferredMusic: String,
  coolOffDays: {
    type: Number,
    default: 30
  },
  starred: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes
videoSchema.index({ userId: 1 });
videoSchema.index({ category: 1 });
videoSchema.index({ isActive: 1 });
videoSchema.index({ starred: 1 });
videoSchema.index({ nextPostDate: 1 });

export const Video = mongoose.model<IVideo>('Video', videoSchema);

// Export model alias for service compatibility
export const VideoModel = Video;

// Export interfaces for backward compatibility
export interface VideoCreateInput {
  userId: string;
  title: string;
  description?: string;
  filename: string;
  filePath: string;
  fileSize: number;
  duration?: number;
  resolution?: string;
  hasAudio?: boolean;
  category: 'real-estate' | 'cartoon';
  propertyType?: string;
  location?: string;
  price?: number;
  tags?: string[];
  preferredCaption?: string;
  preferredHashtags?: string[];
  preferredMusic?: string;
  coolOffDays?: number;
}

export interface VideoUpdateInput {
  title?: string;
  description?: string;
  thumbnailPath?: string;
  category?: 'real-estate' | 'cartoon';
  propertyType?: string;
  location?: string;
  price?: number;
  tags?: string[];
  aiScore?: number;
  isActive?: boolean;
  preferredCaption?: string;
  preferredHashtags?: string[];
  preferredMusic?: string;
  coolOffDays?: number;
  starred?: boolean;
} 