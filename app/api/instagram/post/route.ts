import { NextRequest, NextResponse } from "next/server";
import { publishToInstagram } from "@/lib/instagram/publish";

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, caption } = await req.json();
    const result = await publishToInstagram(videoUrl, caption);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Instagram post error:", error);
    return NextResponse.json({ success: false, error: "Instagram post failed." }, { status: 500 });
  }
} 