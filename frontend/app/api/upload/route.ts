import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/aws/uploadToS3';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('video') as File;

  if (!file) {
    return NextResponse.json({ error: 'Missing video' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const url = await uploadToS3(buffer, file.name);

  return NextResponse.json({ url });
} 