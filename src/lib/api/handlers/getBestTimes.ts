import { Request, Response } from "express";
import { getBestPostingHours } from "../../analytics/viewerActivity";

export default async function handler(req: Request, res: Response) {
  const hours = await getBestPostingHours();
  return res.status(200).json({ hours });
} 