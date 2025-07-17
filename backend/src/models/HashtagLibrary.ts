import mongoose, { Schema, Document } from 'mongoose';

export interface IHashtagLibrary extends Document {
  userId: string;
  category: 'real_estate' | 'viral' | 'trending' | 'custom';
  hashtags: string[];
  performance: {
    averageEngagement: number;
    totalUses: number;
    lastUsed: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hashtagLibrarySchema = new Schema<IHashtagLibrary>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  category: {
    type: String,
    enum: ['real_estate', 'viral', 'trending', 'custom'],
    required: true
  },
  hashtags: [{
    type: String,
    required: true
  }],
  performance: {
    averageEngagement: {
      type: Number,
      default: 0
    },
    totalUses: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes
hashtagLibrarySchema.index({ userId: 1, category: 1 }, { unique: true });
hashtagLibrarySchema.index({ userId: 1, isActive: 1 });

export const HashtagLibrary = mongoose.model<IHashtagLibrary>('HashtagLibrary', hashtagLibrarySchema); 