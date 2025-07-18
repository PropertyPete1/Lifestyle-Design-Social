import { NextRequest, NextResponse } from "next/server";
import { uploadVideoToYouTube } from "@/lib/youtube/upload";

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, title, description } = await req.json();
    const response = await uploadVideoToYouTube(videoUrl, title, description);
    return NextResponse.json({ success: true, videoId: response.id });
  } catch (error) {
    console.error("YouTube post error:", error);
    return NextResponse.json({ success: false, error: "YouTube post failed." }, { status: 500 });
  }
} 