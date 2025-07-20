import { Request, Response } from "express";
import { db } from "../db/mongoClient";

export default async function handler(req: Request, res: Response) {
  const { cartoonUrl, prompt, jobId } = req.body;

  if (!cartoonUrl || !prompt || !jobId) {
    return res.status(400).json({ error: "Missing data" });
  }

  await db.collection("cartoon_jobs").updateOne(
    { jobId },
    { $set: { cartoonUrl, completedAt: new Date() } }
  );

  return res.status(200).json({ message: "Cartoon stored." });
} 