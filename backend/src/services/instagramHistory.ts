import mongoose, { Schema, Document } from 'mongoose';

export interface IInstagramHistory extends Document {
  mediaId: string;
  caption: string;
  hashtags: string[];
  mediaType: string;
  mediaUrl: string;
  permalink: string;
  timestamp: Date;
  likeCount: number;
  commentsCount: number;
  insights?: Record<string, any>;
}

const InstagramHistorySchema = new Schema<IInstagramHistory>({
  mediaId: { type: String, required: true, unique: true },
  caption: { type: String },
  hashtags: [{ type: String }],
  mediaType: { type: String },
  mediaUrl: { type: String },
  permalink: { type: String },
  timestamp: { type: Date },
  likeCount: { type: Number },
  commentsCount: { type: Number },
  insights: { type: Schema.Types.Mixed },
});

export const InstagramHistory = mongoose.models.InstagramHistory || mongoose.model<IInstagramHistory>('InstagramHistory', InstagramHistorySchema); 