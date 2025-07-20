import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db/mongoClient";
import { Video } from "@/lib/db/videoModel";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const videos = await Video.find({
    scheduledAt: { $gte: start, $lte: end },
  }).sort({ scheduledAt: 1 });

  res.status(200).json({ videos });
} 