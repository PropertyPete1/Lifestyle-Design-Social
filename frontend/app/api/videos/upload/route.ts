import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';
import { extractVideoMetadata } from '@/lib/video/extractMetadata';
import { connectToDatabase } from '@/lib/mongo';
import Video from '@/models/Video';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('video') as File;
  const filename = `${Date.now()}-${file.name}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  await mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  await connectToDatabase();

  const metadata = await extractVideoMetadata(filepath);

  const newVideo = await Video.create({
    filename,
    path: `/uploads/${filename}`,
    duration: metadata.duration,
    width: metadata.width,
    height: metadata.height,
    size: metadata.size,
    format: metadata.format,
  });

  return NextResponse.json({ success: true, video: newVideo });
} 