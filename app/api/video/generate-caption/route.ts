import { NextRequest, NextResponse } from "next/server";
import { generateCaption } from "@/lib/openai/caption";

export async function POST(req: NextRequest) {
  try {
    const { videoTitle } = await req.json();
    const caption = await generateCaption(videoTitle);
    return NextResponse.json({ success: true, caption });
  } catch (error) {
    console.error("Caption generation failed:", error);
    return NextResponse.json({ success: false, error: "Caption generation error." }, { status: 500 });
  }
} 