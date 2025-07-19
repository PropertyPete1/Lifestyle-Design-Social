import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const posts = await db.instagramPost.findMany({
    orderBy: { timestamp: 'desc' },
  })

  // Limit to 10 posts
  const limitedPosts = posts.slice(0, 10)

  return NextResponse.json(limitedPosts)
} 