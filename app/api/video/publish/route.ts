import { NextRequest, NextResponse } from 'next/server';
import { publishToInstagram } from '@/lib/instagram/publish';
import { InstagramPostPayload } from '@/lib/instagram/types';

export async function POST(req: NextRequest) {
  const body: InstagramPostPayload = await req.json();

  try {
    const result = await publishToInstagram(body);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
} 