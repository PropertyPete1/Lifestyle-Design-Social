import { NextRequest, NextResponse } from "next/server";
import { uploadVideoToS3 } from "@/lib/utils/videoStorage";
import { saveVideoMetadata } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File;
    const videoUrl = await uploadVideoToS3(file);
    const metadata = await saveVideoMetadata(videoUrl, file.name);
    return NextResponse.json({ success: true, metadata });
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json({ success: false, error: "Video upload failed." }, { status: 500 });
  }
} 