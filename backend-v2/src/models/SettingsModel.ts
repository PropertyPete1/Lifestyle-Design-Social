import mongoose from 'mongoose'

const SettingsSchema = new mongoose.Schema({
  // Core credentials
  instagramToken: String,
  instagramAccount: String,
  facebookPage: String,
  youtubeToken: String,
  youtubeRefresh: String,
  youtubeChannel: String,
  youtubeClientId: String,
  youtubeClientSecret: String,
  youtubeApiKey: String,
  dropboxToken: String,
  mongodbUri: String,
  runwayApi: String,
  openaiApi: String,
  s3AccessKey: String,
  s3SecretKey: String,
  s3Bucket: String,
  s3Region: String,
  
  // Mode settings
  autopilot: { type: Boolean, default: false },
  manual: { type: Boolean, default: true },
  
  // Scheduler settings
  postTime: { type: String, default: '14:00' },
  timezone: { type: String, default: 'America/Chicago' }, // Austin, Texas timezone
  peakHours: { type: Boolean, default: true },
  maxPosts: { type: Number, default: 3 },
  repostDelay: { type: Number, default: 1 },
  
  // Visual settings
  thumbnailMode: { type: String, default: 'first' },
  editorStyle: { type: String, default: 'simple' },
  cartoon: { type: Boolean, default: false },
  
  // Platform settings
  postToInstagram: { type: Boolean, default: true },
  postToYouTube: { type: Boolean, default: true },
  crossPost: { type: Boolean, default: false },
  
  // Storage settings
  dropboxFolder: { type: String, default: '/Bulk Upload' },
  fileRetention: { type: Number, default: 7 },
  
  // Phase 9 specific settings
  minViews: { type: Number, default: 10000 },
  trendingAudio: { type: Boolean, default: true },
  aiCaptions: { type: Boolean, default: true },
  dropboxSave: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Update timestamps on save
SettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Settings', SettingsSchema)