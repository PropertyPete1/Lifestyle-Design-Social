import { Video } from "../db/videoModel";

export async function logView(videoId: string) {
  const video = await Video.findById(videoId);
  if (!video) return;
  // Add view tracking logic later (e.g., counters, timestamps)
} 