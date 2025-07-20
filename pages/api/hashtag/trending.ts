import type { NextApiRequest, NextApiResponse } from "next";
import { getTrendingHashtags } from "@/lib/hashtags/getTrendingHashtags";

export default function handler(_: NextApiRequest, res: NextApiResponse) {
  const tags = getTrendingHashtags();
  res.status(200).json({ hashtags: tags });
} 