import ffmpeg from "fluent-ffmpeg";
import path from "path";

export function generateThumbnail(videoPath: string, outDir: string): Promise<string> {
  const output = path.join(outDir, `${Date.now()}-thumb.jpg`);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on("end", () => resolve(output))
      .on("error", reject)
      .screenshots({
        count: 1,
        folder: outDir,
        filename: path.basename(output),
        size: "640x?",
      });
  });
} 