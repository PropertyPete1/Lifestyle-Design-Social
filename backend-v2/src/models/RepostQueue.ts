import mongoose from 'mongoose';

const RepostQueueSchema = new mongoose.Schema({
  originalPostId: { type: String, required: true },
  originalUrl: String,
  targetPlatform: { type: String, enum: ['instagram', 'youtube'], required: true },
  status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' },
  scheduledFor: Date,
  priority: { type: Number, default: 1 },
  newCaption: String,
  hashtags: [String],
  audioId: String,
  mediaUrl: String,
  dropboxPath: String,
  error: String,
  processedAt: Date,
  postedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamps on save
RepostQueueSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const RepostQueue = mongoose.model('RepostQueue', RepostQueueSchema);