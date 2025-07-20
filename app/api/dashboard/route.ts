import { NextResponse } from 'next/server';
import { getAnalyticsData } from '@/lib/dashboard/getAnalyticsData';

export async function GET() {
  try {
    const data = await getAnalyticsData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
} 