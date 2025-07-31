import mongoose from 'mongoose';

const InstagramContentSchema = new mongoose.Schema({
  igPostId: { type: String, required: true, unique: true },
  caption: String,
  hashtags: [String],
  audioId: String,
  mediaUrl: String,
  mediaType: { type: String, enum: ['VIDEO', 'IMAGE', 'CAROUSEL'], default: 'VIDEO' },
  postTime: Date,
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  performanceScore: { type: Number, default: 0 },
  repostEligible: { type: Boolean, default: false },
  scraped: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamps on save
InstagramContentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const InstagramArchive = mongoose.model('InstagramArchive', InstagramContentSchema);