import { connectToDatabase } from "@/lib/db/mongoClient";
import { Video } from "@/lib/db/videoModel";

export async function schedulePost(videoId: string) {
  await connectToDatabase();

  const now = new Date();
  const existing = await Video.find({ scheduledAt: { $gte: now } }).sort({ scheduledAt: 1 });

  const slots = [9, 14, 19]; // 9am, 2pm, 7pm
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  let nextSlot: Date | null = null;

  for (let i = 0; i < 7; i++) {
    const date = new Date(dayStart);
    date.setDate(date.getDate() + i);

    for (const hour of slots) {
      const slot = new Date(date);
      slot.setHours(hour, 0, 0, 0);
      const taken = existing.some((v: any) => new Date(v.scheduledAt).getTime() === slot.getTime());
      if (!taken) {
        nextSlot = slot;
        break;
      }
    }

    if (nextSlot) break;
  }

  await Video.findByIdAndUpdate(videoId, { scheduledAt: nextSlot });
  return nextSlot;
} 