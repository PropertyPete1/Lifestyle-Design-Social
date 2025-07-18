import { NextResponse } from 'next/server'
import connectMongo from '@/lib/db/mongo'
import CartoonVideo from '@/lib/db/models/CartoonVideo'

export async function GET() {
  await connectMongo()
  const upcoming = await CartoonVideo.find({
    userId: 'demo-user-id',
    scheduledFor: { $ne: null },
    status: 'complete',
  })
    .sort({ scheduledFor: 1 })
    .lean()

  // Add mock platform if missing (default to Instagram)
  const enriched = upcoming.map((item) => ({
    ...item,
    platform: item.platform || 'instagram',
  }))

  return NextResponse.json(enriched)
} 