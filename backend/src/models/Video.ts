import mongoose from 'mongoose';

const VideoSchema = new mongoose.Schema({
  filename: String,
  s3Url: String,
  caption: String,
  platform: { type: String, enum: ['instagram', 'youtube'], default: 'instagram' },
  scheduledFor: Date,
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'scheduled', 'posted'], default: 'draft' },
}, { timestamps: true });

export const VideoModel = mongoose.models.Video || mongoose.model('Video', VideoSchema);
