# 🏠 Real Estate Video Management System

## Overview

This system allows you to upload, manage, and automatically post your real estate videos with smart scheduling to avoid over-posting and maximize engagement.

## 🎯 Key Features

### Smart Video Selection
- **7-Day Cooldown**: Videos won't be reposted for 7 days after their last post
- **Post Count Tracking**: Tracks how many times each video has been posted
- **Random Selection**: Among eligible videos, selection is randomized for variety
- **Priority System**: Videos with fewer posts get priority

### Upload Management
- **Drag & Drop**: Easy video upload with drag-and-drop interface
- **Video Preview**: Watch your videos directly in the app
- **Caption Management**: Add and edit captions for each video
- **File Organization**: Videos are stored securely and organized by user

### Posting Schedule
- **3 Posts Per Day**: Morning (9am), Afternoon (1pm), Evening (6pm)
- **Alternating Content**: 
  - Your real estate videos
  - AI-generated cartoon videos
  - Your real estate videos again
- **Automatic Rotation**: Prevents content fatigue and maintains variety

## 📱 How to Use

### 1. Upload Your Videos

1. Navigate to the **Videos** page in the app
2. Drag and drop your real estate videos into the upload area
3. Or click "Select Videos" to browse your files
4. Add captions for each video (optional but recommended)
5. Videos are automatically processed and ready for posting

### 2. Monitor Your Video Library

The **Videos** page shows:
- **Video Preview**: Watch your uploaded videos
- **Posting Status**: See how many times each video has been posted
- **Last Posted Date**: Track when videos were last used
- **Caption Management**: Edit captions anytime
- **File Information**: Duration, size, and other metadata

### 3. Auto-Posting Dashboard

The **AutoPost** page displays:
- **Video Statistics**: Total videos, posts, averages
- **Next Video**: See which video will be posted next
- **Ready Videos**: Count of videos available for posting
- **Unposted Videos**: New videos that haven't been posted yet

### 4. Smart Posting Logic

The system automatically:
- Selects videos that haven't been posted in 7+ days
- Prioritizes videos with fewer total posts
- Randomizes selection among eligible videos
- Marks videos as posted after successful posting
- Tracks posting history to avoid repetition

## 🎨 Caption Strategy

### For Your Real Estate Videos
- **Reuse High-Performing Captions**: System can reuse successful captions
- **Automatic Tweaking**: Small variations are made for uniqueness
- **Custom Captions**: Add your own captions in the video management interface
- **Viral Tactics**: Include CTAs like "Tag someone who'd love this kitchen!"

### For Cartoon Videos
- **Humorous Captions**: Pull from funny real estate meme captions
- **AI Generation**: GPT integration for dynamic caption creation
- **Relatable Content**: Focus on agent/buyer/seller experiences

## 🏷️ Hashtag Management

### Master Hashtag Lists
- **Real Estate Hashtags**: #realestate #homesforsale #luxuryhomes
- **Viral/Meme Hashtags**: #fyp #viral #trending #funny
- **Local Hashtags**: #texasrealestate #austinrealestate

### Smart Hashtag Selection
- **25-30 Hashtags** per post
- **Randomized Order** for uniqueness
- **Trending Integration**: Occasionally includes trending hashtags
- **Category Matching**: Real estate hashtags for your videos, viral hashtags for cartoons

## 📊 Video Status Indicators

### Status Types
- **New**: Never posted (green badge)
- **Recently Posted**: Posted within 7 days (yellow badge)
- **Ready to Post**: Available for posting (blue badge)
- **Ready to Repost**: Posted 7+ days ago (blue badge)

### Posting Frequency
- **Never Posted**: Videos that haven't been used yet
- **Posted Today**: Videos posted today
- **Posted Yesterday**: Videos posted yesterday
- **Posted X days ago**: Shows exact days since last post

## 🔧 Technical Details

### Database Schema
```sql
videos table:
- id (PRIMARY KEY)
- userId (FOREIGN KEY)
- title, description, filePath
- postCount (INTEGER DEFAULT 0)
- lastPosted (DATETIME)
- nextPostDate (DATETIME)
- isActive (BOOLEAN DEFAULT 1)
```

### API Endpoints
- `GET /api/videos` - Get user's videos and stats
- `POST /api/videos/upload` - Upload new video
- `PUT /api/videos/:id` - Update video caption/metadata
- `DELETE /api/videos/:id` - Delete video
- `GET /api/videos/:id/stream` - Stream video file
- `GET /api/autopost/next-video` - Get next video for posting
- `POST /api/autopost/mark-video-posted` - Mark video as posted
- `GET /api/autopost/video-stats` - Get posting statistics

### File Storage
- Videos stored in `uploads/` directory
- Unique filenames with timestamps
- Automatic cleanup when videos are deleted
- Support for multiple video formats (MP4, MOV, AVI, etc.)

## 🚀 Best Practices

### Video Upload
1. **Quality**: Upload high-quality videos (1080p or higher)
2. **Duration**: Keep videos 15-60 seconds for optimal engagement
3. **Captions**: Add engaging captions that tell a story
4. **Variety**: Upload different types of content (house tours, market updates, tips)

### Content Strategy
1. **Regular Uploads**: Upload new videos regularly to maintain variety
2. **Caption Variety**: Use different caption styles and lengths
3. **Hashtag Testing**: Monitor which hashtags perform best
4. **Engagement Tracking**: Watch for patterns in successful posts

### System Maintenance
1. **Monitor Stats**: Check video statistics regularly
2. **Clean Up**: Remove old or underperforming videos
3. **Update Captions**: Refresh captions for better engagement
4. **Backup**: Keep copies of your best videos

## 🎯 Workflow Summary

### Daily Workflow
1. **Record**: Create house tour videos
2. **Upload**: Add videos to the app
3. **Caption**: Add engaging captions
4. **Monitor**: Check auto-posting dashboard
5. **Relax**: Let the system handle posting

### Weekly Review
1. **Check Stats**: Review video performance
2. **Upload New**: Add fresh content
3. **Update Captions**: Improve existing captions
4. **Monitor Engagement**: Track which content performs best

## 🔍 Troubleshooting

### Common Issues
- **No Videos Available**: Upload more videos or wait for 7-day cooldown
- **Upload Failures**: Check file format and size (max 100MB)
- **Streaming Issues**: Ensure video files are not corrupted
- **Caption Not Saving**: Check internet connection and try again

### Performance Tips
- **Compress Videos**: Use smaller file sizes for faster uploads
- **Batch Upload**: Upload multiple videos at once
- **Regular Maintenance**: Clean up old videos periodically
- **Monitor Storage**: Keep an eye on upload directory size

## 📈 Success Metrics

Track these metrics for success:
- **Total Videos**: Aim for 20+ videos in your library
- **Posting Frequency**: 3 posts per day consistently
- **Engagement Rate**: Monitor likes, comments, shares
- **Caption Performance**: Track which captions get more engagement
- **Video Variety**: Ensure diverse content types

---

**💡 Pro Tip**: The system is designed to prevent over-posting while maximizing your content's reach. Trust the smart selection algorithm and focus on creating quality content! 