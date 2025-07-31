// ✅ PHASE 9.5 – DROPBOX SYNC AFTER POSTING
// ❌ Do not touch frontend
// ✅ Plug into backend-v2 autopilot posting flow
// ✅ For each posted video, upload to Dropbox with same file name
// ✅ Create /AutoPilot/YYYY-MM-DD/ as parent folder if it doesn't exist
// ✅ Save metadata (caption, hashtags, platforms) in MongoDB `reposts` log
// ✅ Skip upload if already synced

// ✅ FILE: backend-v2/jobs/dropboxSync.ts

import { MongoClient } from 'mongodb'
import axios from 'axios'
import { Dropbox } from 'dropbox'
import dayjs from 'dayjs'
import * as path from 'path'

const MONGODB_URI = process.env.MONGODB_URI!
const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN!

const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN })

async function dropboxSync() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db()
  const reposts = db.collection('reposts')

  const unsynced = await reposts.find({ dropboxSynced: { $ne: true } }).limit(5).toArray()

  for (const post of unsynced) {
    const dateFolder = dayjs(post.postedAt).format('YYYY-MM-DD')
    const filename = `/${dateFolder}/${post.igPostId || `video_${Date.now()}`}.mp4`

    try {
      const res = await axios.get(post.videoUrl, { responseType: 'arraybuffer' })
      const upload = await dbx.filesUpload({
        path: `/AutoPilot${filename}`,
        contents: res.data,
        mode: { '.tag': 'add' }
      })

      await reposts.updateOne(
        { _id: post._id },
        {
          $set: {
            dropboxSynced: true,
            dropboxPath: upload.result.path_display
          }
        }
      )

      console.log(`✅ Synced to Dropbox: ${upload.result.path_display}`)
    } catch (err) {
      console.error(`❌ Failed Dropbox upload for ${filename}`, err)
    }
  }

  await client.close()
}

dropboxSync()