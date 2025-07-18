import { db } from "../db";

export async function logYouTubePost({
  title,
  description,
  videoUrl,
  tags,
  categoryId,
  videoId,
}: {
  title: string;
  description: string;
  videoUrl: string;
  tags?: string[];
  categoryId?: string;
  videoId: string;
}) {
  const post = {
    title,
    description,
    videoUrl,
    tags,
    categoryId,
    videoId,
    createdAt: new Date(),
  };

  await db.collection("youtube_posts").insertOne(post);
} 