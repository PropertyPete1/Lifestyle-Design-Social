import { db } from './index'
import { syncCaptions } from '../instagram/syncCaptions'

export async function initDatabase() {
  console.log('🔄 Syncing captions on boot...')
  await syncCaptions()
  console.log('✅ Captions synced.')
} 