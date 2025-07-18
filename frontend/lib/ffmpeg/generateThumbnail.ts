import ffmpeg from "fluent-ffmpeg";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";

export function generateThumbnail(videoPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const filename = `${uuid()}.jpg`;
    const outputPath = path.join("public/uploads/thumbnails", filename);

    ffmpeg(videoPath)
      .on("end", () => resolve(`/uploads/thumbnails/${filename}`))
      .on("error", (err) => reject(err))
      .screenshots({
        count: 1,
        folder: "public/uploads/thumbnails",
        filename,
        size: "640x360",
      });
  });
} 