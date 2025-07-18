import { connectDB } from '@/lib/mongo';
import Video from '@/models/Video';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const videos = await Video.find().sort({ createdAt: -1 });
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return new NextResponse('Failed to fetch videos', { status: 500 });
  }
} 