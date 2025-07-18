import mongoose, { Schema, Document } from 'mongoose';

export interface ICaption extends Document {
  userId: string;
  videoId?: string;
  content: string;
  tone: 'professional' | 'casual' | 'funny' | 'luxury';
  hashtags: string[];
  emojis: string[];
  length: number;
  callToAction?: string;
  template?: string;
  category: 'real_estate' | 'viral' | 'trending' | 'custom';
  isTemplate: boolean;
  performance?: {
    totalUses: number;
    averageEngagement: number;
    lastUsed: Date;
  };
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const captionSchema = new Schema<ICaption>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    videoId: {
      type: String,
      ref: 'Video',
    },
    content: {
      type: String,
      required: true,
      maxlength: 2200, // Instagram caption limit
    },
    tone: {
      type: String,
      enum: ['professional', 'casual', 'funny', 'luxury'],
      required: true,
    },
    hashtags: [
      {
        type: String,
        required: true,
      },
    ],
    emojis: [
      {
        type: String,
      },
    ],
    length: {
      type: Number,
      required: true,
    },
    callToAction: {
      type: String,
      maxlength: 100,
    },
    template: {
      type: String,
    },
    category: {
      type: String,
      enum: ['real_estate', 'viral', 'trending', 'custom'],
      required: true,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    performance: {
      totalUses: {
        type: Number,
        default: 0,
      },
      averageEngagement: {
        type: Number,
        default: 0,
      },
      lastUsed: {
        type: Date,
      },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
captionSchema.index({ userId: 1, category: 1 });
captionSchema.index({ userId: 1, isTemplate: 1 });
captionSchema.index({ tone: 1, category: 1 });
captionSchema.index({ generatedAt: -1 });

export const Caption = mongoose.model<ICaption>('Caption', captionSchema);

// Export model alias for service compatibility
export const CaptionModel = Caption;
