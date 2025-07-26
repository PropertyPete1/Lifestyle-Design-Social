import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoStatus extends Document {
  videoId: string;
  uploadDate: Date;
  platform: 'youtube' | 'instagram';
  captionGenerated: boolean;
  posted: boolean;
  lastPosted?: Date;
  fingerprint: {
    hash: string;
    size: number;
    duration?: number;
  };
  filename: string;
  filePath?: string;
  status: 'pending' | 'processing' | 'ready' | 'posted' | 'failed';
  errorMessage?: string;
}

const VideoStatusSchema = new Schema<IVideoStatus>({
  videoId: { type: String, required: true, unique: true },
  uploadDate: { type: Date, default: Date.now },
  platform: { type: String, enum: ['youtube', 'instagram'], required: true },
  captionGenerated: { type: Boolean, default: false },
  posted: { type: Boolean, default: false },
  lastPosted: { type: Date },
  fingerprint: {
    hash: { type: String, required: true },
    size: { type: Number, required: true },
    duration: { type: Number }
  },
  filename: { type: String, required: true },
  filePath: { type: String },
  status: { type: String, enum: ['pending', 'processing', 'ready', 'posted', 'failed'], default: 'pending' },
  errorMessage: { type: String }
});

// Add indexes for efficient queries
VideoStatusSchema.index({ 'fingerprint.hash': 1 });
VideoStatusSchema.index({ platform: 1, posted: 1 });
VideoStatusSchema.index({ uploadDate: -1 });

export const VideoStatus = mongoose.model<IVideoStatus>('VideoStatus', VideoStatusSchema); 