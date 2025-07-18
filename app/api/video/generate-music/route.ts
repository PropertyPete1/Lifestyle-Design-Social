import { NextRequest, NextResponse } from "next/server";
import { suggestMusic } from "@/lib/openai/music";

export async function POST(req: NextRequest) {
  try {
    const { caption } = await req.json();
    const music = await suggestMusic(caption);
    return NextResponse.json({ success: true, music });
  } catch (error) {
    console.error("Music suggestion error:", error);
    return NextResponse.json({ success: false, error: "Music suggestion failed." }, { status: 500 });
  }
} 