import { NextRequest, NextResponse } from "next/server";
import { publishToInstagram } from "@/lib/instagram/publish";

export async function POST(req: NextRequest) {
  try {
    const { uploadId, caption } = await req.json();
    const result = await publishToInstagram(uploadId, caption);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("Instagram publish error:", err);
    return NextResponse.json({ success: false, error: "Failed to publish to Instagram." }, { status: 500 });
  }
} 