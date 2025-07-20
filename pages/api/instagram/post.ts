import type { NextApiRequest, NextApiResponse } from "next";
import { postToInstagram } from "@/lib/instagram/postToInstagram";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const { url, caption } = req.body;
  if (!url || !caption) return res.status(400).json({ error: "Missing params" });

  const result = await postToInstagram(url, caption);
  res.status(200).json({ status: "Posted", result });
} 