import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    { platform: 'instagram', views: 4283, likes: 952, comments: 44, shares: 121 },
    { platform: 'youtube', views: 6201, likes: 1188, comments: 99, shares: 302 },
    { platform: 'tiktok', views: 8910, likes: 1401, comments: 123, shares: 354 },
  ]);
} 