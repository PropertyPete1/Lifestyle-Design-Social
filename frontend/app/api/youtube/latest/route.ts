import { fetchLatestVideos } from '@/lib/youtube/fetchLatestVideos'
import { NextResponse } from 'next/server'

export async function GET() {
  const data = await fetchLatestVideos()
  return NextResponse.json({ videos: data })
} 