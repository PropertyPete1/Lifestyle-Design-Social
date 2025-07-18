import { NextResponse } from 'next/server'
import connectMongo from '@/lib/db/mongo'
import Caption from '@/lib/db/models/Caption'

export async function GET() {
  await connectMongo()
  const data = await Caption.find({ userId: 'demo-user-id' }).sort({ createdAt: -1 }).limit(50)
  return NextResponse.json(data)
} 