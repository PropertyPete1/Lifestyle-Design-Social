import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db/mongoClient";
import { Video } from "@/lib/db/videoModel";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") return res.status(405).end("Method not allowed");

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing ID" });

  await connectToDatabase();
  await Video.findByIdAndDelete(id);

  res.status(200).json({ deleted: true });
} 