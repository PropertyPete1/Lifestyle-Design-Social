import mongoose, { Schema, Document } from 'mongoose';

export interface IThumbnailSelection extends Document {
  videoId: string;
  thumbnailPath: string;
  timestamp: number;
  score: number;
  faceCount: number;
  textPresent: boolean;
  colorScore: number;
  compositionScore: number;
  engagementPrediction: number;
  reasoning: string;
  selected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const thumbnailSelectionSchema = new Schema<IThumbnailSelection>({
  videoId: {
    type: String,
    required: true
  },
  thumbnailPath: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    required: true,
    min: 0
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  faceCount: {
    type: Number,
    default: 0,
    min: 0
  },
  textPresent: {
    type: Boolean,
    default: false
  },
  colorScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  compositionScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  engagementPrediction: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  reasoning: {
    type: String,
    default: ''
  },
  selected: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes
thumbnailSelectionSchema.index({ videoId: 1 });
thumbnailSelectionSchema.index({ videoId: 1, selected: 1 });
thumbnailSelectionSchema.index({ videoId: 1, score: -1 });

export const ThumbnailSelection = mongoose.model<IThumbnailSelection>('ThumbnailSelection', thumbnailSelectionSchema); 