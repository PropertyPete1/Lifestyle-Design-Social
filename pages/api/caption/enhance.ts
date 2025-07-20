import type { NextApiRequest, NextApiResponse } from "next";
import { enhanceCaption } from "@/lib/captions/enhanceCaption";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const { baseCaption } = req.body;
  if (!baseCaption) return res.status(400).json({ error: "Missing caption" });

  const result = await enhanceCaption(baseCaption);
  res.status(200).json({ caption: result });
} 