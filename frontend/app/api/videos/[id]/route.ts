import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const videos = db.collection('videos');

    const video = await videos.findOne({ _id: new ObjectId(params.id) });

    if (!video) {
      return NextResponse.json({ message: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json(video, { status: 200 });
  } catch (error) {
    console.error('Error fetching video by ID:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 