import mongoose from 'mongoose';

const AutopilotLogSchema = new mongoose.Schema({
  runId: { type: String, required: true },
  type: { type: String, enum: ['scrape', 'repost', 'schedule', 'post', 'force_post'], required: true },
  platform: String,
  status: { type: String, enum: ['started', 'completed', 'failed'], required: true },
  postsProcessed: { type: Number, default: 0 },
  postsSuccessful: { type: Number, default: 0 },
  postsFailed: { type: Number, default: 0 },
  error: String,
  details: mongoose.Schema.Types.Mixed,
  startTime: Date,
  endTime: Date,
  duration: Number, // in milliseconds
  createdAt: { type: Date, default: Date.now }
});

export const AutopilotLog = mongoose.model('AutopilotLog', AutopilotLogSchema);