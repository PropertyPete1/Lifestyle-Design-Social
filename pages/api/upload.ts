import type { NextApiRequest, NextApiResponse } from "next";
import { uploadToS3 } from "@/lib/upload/uploadToS3";
import { connectToDatabase } from "@/lib/db/mongoClient";
import { Video } from "@/lib/db/videoModel";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const { file, fileName, mimeType, type } = req.body;

  if (!file || !fileName || !mimeType) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  await connectToDatabase();

  const buffer = Buffer.from(file, "base64");
  const videoUrl = await uploadToS3(buffer, fileName, mimeType);

  const video = await Video.create({
    url: videoUrl,
    type,
  });

  res.status(200).json(video);
} 