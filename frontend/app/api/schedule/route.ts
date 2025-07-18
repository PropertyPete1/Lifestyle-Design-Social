import { NextResponse } from 'next/server';
import connectMongo from '@/lib/db/mongo';
import Video from '@/lib/db/models/Video';

export async function GET() {
  await connectMongo();
  const posts = await Video.find({ scheduledAt: { $ne: null } })
    .sort({ scheduledAt: 1 })
    .select('_id scheduledAt platform fileUrl');

  const mapped = posts.map((post) => ({
    id: post._id.toString(),
    platform: post.platform,
    scheduledAt: post.scheduledAt,
    videoTitle: post.fileUrl.split('/').pop()?.replace('.mp4', '') || 'Video',
  }));

  return NextResponse.json(mapped);
} 