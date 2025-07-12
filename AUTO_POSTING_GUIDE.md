# 🤖 AI Auto-Posting System Guide

## Overview
Your Auto-Posting App now includes an advanced AI-powered system that automatically:
- **Scans your camera roll** for videos with audio
- **AI-selects the best content** for your buyer audience (30-90 day timeline)
- **Posts 3 times daily** at optimal viral times
- **Generates buyer-focused captions** and hashtags

## 🎯 Target Audience
This system is specifically designed for:
- **Active homebuyers** looking to purchase within 30-90 days
- **First-time homebuyers** in your market
- **Real estate investors** seeking opportunities
- **Buyers who are actively browsing** social media for properties

## 🚀 Quick Start

### 1. Enable Auto-Posting
1. Navigate to **Auto-Post** in the sidebar
2. Set your **Camera Roll Path** (default: `/Users/peterallen/Pictures/Camera Roll`)
3. Click **"Enable Auto-Posting"**

### 2. Test Your Setup
1. Click **"Test Scan Camera Roll"** to see what videos are available
2. Review the AI scores and video quality
3. Click **"Scan & Prepare Videos"** to copy videos to the system

### 3. Manual Test
1. Click **"Manual Post Now"** to test posting immediately
2. Check your social media accounts for the post

## 📱 How It Works

### Video Selection Criteria
The AI automatically filters videos based on:
- ✅ **Has audio** (crucial for engagement)
- ✅ **15-300 seconds** duration (optimal for social media)
- ✅ **720p+ resolution** (professional quality)
- ✅ **Under 100MB** (upload-friendly)
- ✅ **AI score 6+/10** (buyer appeal)

### Optimal Posting Times
Posts automatically at:
- **9:00 AM EST** - Morning buyers checking before work
- **12:00 PM EST** - Lunch break peak social media time  
- **6:00 PM EST** - Evening buyers relaxing and browsing

### AI Content Generation
Each post includes:
- **Buyer-focused captions** with urgency and FOMO
- **Investment-focused hashtags** targeting active buyers
- **Market timing messaging** for 30-90 day buyers
- **Clear call-to-action** for inquiries

## 🎛️ Controls

### Enable/Disable
- **Enable**: Turns on automatic 3x daily posting
- **Disable**: Stops all automatic posting

### Camera Roll Path
- Set the folder path where your videos are stored
- Default: `/Users/peterallen/Pictures/Camera Roll`
- Can be any folder with video files

### Quick Actions
- **Test Scan**: Preview available videos without copying
- **Scan & Prepare**: Copy videos to system for posting
- **Manual Post**: Trigger an immediate post

## 📊 Monitoring

### Status Dashboard
- **Auto-posting status** (enabled/disabled)
- **Camera roll path** being monitored
- **Next scheduled post time**
- **Posting schedule** (3 times daily)

### Scan Results
- **Total videos found** in camera roll
- **Videos selected** by AI
- **AI scores** for each video (1-10)
- **Video quality metrics** (duration, size, resolution)

## 🔧 Configuration

### Environment Variables
Add to your `.env` file:
```
CAMERA_ROLL_PATH=/Users/peterallen/Pictures/Camera Roll
OPENAI_API_KEY=your-openai-api-key
TWITTER_API_KEY=your-twitter-api-key
INSTAGRAM_USERNAME=your-instagram-username
```

### API Keys Required
- **OpenAI API Key**: For AI content generation
- **Twitter API Keys**: For posting to Twitter
- **Instagram Credentials**: For posting to Instagram

## 🎯 Best Practices

### Video Content
- **Record with audio** - crucial for engagement
- **Keep videos 15-60 seconds** for optimal social media performance
- **Show property highlights** and lifestyle features
- **Include neighborhood context** when possible

### Content Strategy
- **Focus on buyer benefits** (investment, lifestyle, equity)
- **Create urgency** with market timing
- **Use emotional triggers** that drive buyer engagement
- **Include clear calls-to-action** for inquiries

### Monitoring
- **Check scan results** regularly to ensure quality videos
- **Monitor engagement** on posted content
- **Adjust camera roll path** if needed
- **Test manual posts** before enabling auto-posting

## 🚨 Troubleshooting

### Common Issues
1. **No videos found**: Check camera roll path is correct
2. **Videos rejected**: Ensure they have audio and meet quality criteria
3. **Posts not appearing**: Verify social media API credentials
4. **AI content issues**: Check OpenAI API key is valid

### Support
- Check the **Analytics** page for post performance
- Review **Posts** page for posting history
- Monitor console logs for detailed error messages

## 🎉 Success Metrics

Track these metrics for success:
- **Engagement rate** on auto-posted content
- **Lead generation** from buyer-focused posts
- **Video quality scores** from AI analysis
- **Posting consistency** (3x daily schedule)

---

**Ready to start?** Navigate to the Auto-Post page and enable the system to begin automatically posting your best videos to your buyer audience! 