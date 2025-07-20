import type { NextApiRequest, NextApiResponse } from "next";
import { schedulePost } from "@/lib/scheduler/schedulePost";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: "Missing video ID" });

  const scheduledAt = await schedulePost(videoId);
  res.status(200).json({ scheduledAt });
} 