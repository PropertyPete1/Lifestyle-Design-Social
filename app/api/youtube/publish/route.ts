import { NextRequest, NextResponse } from "next/server";
import { publishYouTubeVideo } from "@/lib/youtube/publish";

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, title, description } = await req.json();
    const result = await publishYouTubeVideo(videoUrl, title, description);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("YouTube publish error:", error);
    return NextResponse.json({ success: false, error: "YouTube publish failed." }, { status: 500 });
  }
} 