import { fetchHashtagPerformance } from '@/lib/instagram/fetchHashtagPerformance'
import { NextResponse } from 'next/server'

export async function GET() {
  const data = await fetchHashtagPerformance()
  return NextResponse.json({ performance: data })
} 