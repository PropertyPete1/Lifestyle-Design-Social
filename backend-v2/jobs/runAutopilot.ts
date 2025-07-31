// ✅ PHASE 9.4 – SCHEDULED POSTING ENGINE
// ❌ Do not touch frontend
// ✅ Use backend-v2 only
// ✅ Read from smart_autopilot_queue
// ✅ Use settings from /api/settings
// ✅ Respect daily maxPosts + postTime
// ✅ Post to both Instagram and YouTube if enabled
// ✅ Save each posted item to reposts log (avoid future duplicates)
// ✅ Must not run if autopilot: false

// ✅ FILE: backend-v2/jobs/runAutopilot.ts

import { MongoClient } from 'mongodb'
import axios from 'axios'
import { google } from 'googleapis'
import dayjs from 'dayjs'

const MONGODB_URI = process.env.MONGODB_URI!
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN!
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID!
const YOUTUBE_CLIENT_ID = process.env.YT_CLIENT_ID!
const YOUTUBE_CLIENT_SECRET = process.env.YT_CLIENT_SECRET!
const YOUTUBE_REFRESH_TOKEN = process.env.YT_REFRESH_TOKEN!

const oauth2Client = new google.auth.OAuth2(YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET)
oauth2Client.setCredentials({ refresh_token: YOUTUBE_REFRESH_TOKEN })
const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

async function runAutopilot() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db()
  const settings = await db.collection('settings').findOne({})
  const queue = db.collection('smart_autopilot_queue')
  const reposts = db.collection('reposts')

  // Exit if not enabled
  if (!settings?.autopilot) return

  const now = dayjs()
  const currentHour = now.hour()
  const postHour = parseInt(settings.postTime || '13')
  if (currentHour !== postHour) return

  const today = now.format('YYYY-MM-DD')
  const alreadyToday = await reposts.countDocuments({ postedAtDate: today })
  const remaining = (settings.maxPosts || 3) - alreadyToday
  if (remaining <= 0) return

  const candidates = await queue.find({}).sort({ createdAt: 1 }).limit(remaining).toArray()

  for (const post of candidates) {
    // POST TO INSTAGRAM
    if (settings.postToInstagram) {
      await axios.post(
        `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media`,
        {
          media_type: 'VIDEO',
          video_url: post.videoUrl,
          caption: post.caption + ' ' + post.hashtags.join(' '),
          audio_id: post.audioInstagram
        },
        { params: { access_token: INSTAGRAM_ACCESS_TOKEN } }
      )
    }

    // POST TO YOUTUBE
    if (settings.postToYouTube) {
      await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: post.caption.slice(0, 100),
            description: post.caption + '\n\n' + post.hashtags.join(' '),
            tags: post.hashtags.slice(0, 15)
          },
          status: {
            privacyStatus: 'public'
          }
        },
        media: {
          body: axios.get(post.videoUrl, { responseType: 'stream' }).then(res => res.data)
        }
      })
    }

    // Save to repost log
    await reposts.insertOne({
      igPostId: post.igPostId,
      caption: post.caption,
      hashtags: post.hashtags,
      postedAt: new Date(),
      postedAtDate: today,
      platforms: {
        instagram: settings.postToInstagram,
        youtube: settings.postToYouTube
      }
    })

    // Remove from queue
    await queue.deleteOne({ _id: post._id })
  }

  await client.close()
}

runAutopilot()