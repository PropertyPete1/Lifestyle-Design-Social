import { NextRequest, NextResponse } from 'next/server'
import connectMongo from '@/lib/db/mongo'
import CartoonVideo from '@/lib/db/models/CartoonVideo'

export async function POST(req: NextRequest) {
  const { id, scheduledFor } = await req.json()
  await connectMongo()

  await CartoonVideo.findByIdAndUpdate(id, {
    scheduledFor: new Date(scheduledFor),
  })

  return NextResponse.json({ success: true })
} 