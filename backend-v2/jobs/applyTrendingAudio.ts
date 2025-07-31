// ✅ PHASE 9.3 – TRENDING AUDIO INTEGRATION
// ❌ Do not modify frontend layout
// ✅ Update smart_autopilot_queue entries that are missing real audio
// ✅ Fetch:
//    - Instagram trending Reels audio (via Graph API or scraper)
//    - YouTube trending Shorts audio (via unofficial API/scraper)
// ✅ Save audio title, ID, and URL for each platform
// ✅ Update MongoDB `smart_autopilot_queue` entries with real audio for IG and YT

// ✅ FILE: backend-v2/jobs/applyTrendingAudio.ts

import { MongoClient } from 'mongodb'
import axios from 'axios'
import cheerio from 'cheerio'

const MONGODB_URI = process.env.MONGODB_URI!
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN!
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_BUSINESS_ID!

async function fetchInstagramTrendingAudio() {
  // 🔄 TEMPORARY workaround using public Reels audio page
  const { data } = await axios.get('https://www.instagram.com/reels/audio/')
  const $ = cheerio.load(data)
  const audioList: any[] = []

  $('a').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (href.includes('/audio/')) {
      const title = $(el).text().trim()
      const idMatch = href.match(/audio\/(\d+)/)
      if (idMatch) {
        audioList.push({
          title,
          id: idMatch[1],
          url: `https://www.instagram.com${href}`
        })
      }
    }
  })

  return audioList.slice(0, 10) // top 10 trending
}

async function fetchYouTubeTrendingAudio() {
  // 🔄 Scrape trending music from YT Shorts Music page
  const { data } = await axios.get('https://www.youtube.com/shorts/music')
  const audioList: any[] = []

  const audioMatch = data.match(/"musicData":(\[.*?\])/)
  if (audioMatch) {
    const parsed = JSON.parse(audioMatch[1])
    for (const track of parsed.slice(0, 10)) {
      audioList.push({
        title: track.title,
        id: track.id,
        url: `https://www.youtube.com/watch?v=${track.id}`
      })
    }
  }

  return audioList
}

async function applyTrendingAudioToQueue() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db()
  const queue = db.collection('smart_autopilot_queue')

  const instagramAudios = await fetchInstagramTrendingAudio()
  const youtubeAudios = await fetchYouTubeTrendingAudio()

  const smartQueue = await queue.find({ audioInstagram: /dummy/i }).toArray()

  for (const [index, post] of smartQueue.entries()) {
    const igAudio = instagramAudios[index % instagramAudios.length]
    const ytAudio = youtubeAudios[index % youtubeAudios.length]

    await queue.updateOne(
      { _id: post._id },
      {
        $set: {
          audioInstagram: igAudio?.id || '',
          audioInstagramTitle: igAudio?.title || '',
          audioInstagramURL: igAudio?.url || '',

          audioYouTube: ytAudio?.id || '',
          audioYouTubeTitle: ytAudio?.title || '',
          audioYouTubeURL: ytAudio?.url || ''
        }
      }
    )
  }

  await client.close()
}

applyTrendingAudioToQueue()