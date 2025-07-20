import { db } from "../db/mongoClient";

export async function registerUploadedVideos(fileList: { url: string; type: "user" | "cartoon" }[]) {
  if (fileList.length > 30) throw new Error("Too many files. Max allowed is 30.");

  const toInsert = fileList.map((file) => ({
    ...file,
    posted: false,
    uploadedAt: new Date(),
  }));

  return db.collection("videos").insertMany(toInsert);
} 