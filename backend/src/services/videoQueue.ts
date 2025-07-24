import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoQueue extends Document {
  type: 'real_estate' | 'cartoon';
  dropboxUrl: string;
  filename: string;
  status: 'pending' | 'posted' | 'failed';
  uploadedAt: Date;
  postedAt?: Date;
  caption?: string;
  hashtags?: string[];
  instagramPostId?: string;
  duplicateOf?: mongoose.Types.ObjectId;
}

const VideoQueueSchema = new Schema<IVideoQueue>({
  type: { type: String, enum: ['real_estate', 'cartoon'], required: true },
  dropboxUrl: { type: String, required: true },
  filename: { type: String, required: true },
  status: { type: String, enum: ['pending', 'posted', 'failed'], default: 'pending' },
  uploadedAt: { type: Date, default: Date.now },
  postedAt: { type: Date },
  caption: { type: String },
  hashtags: [{ type: String }],
  instagramPostId: { type: String },
  duplicateOf: { type: Schema.Types.ObjectId, ref: 'VideoQueue' },
});

export const VideoQueue = mongoose.models.VideoQueue || mongoose.model<IVideoQueue>('VideoQueue', VideoQueueSchema); 