import { db } from "../db/mongoClient";
import { ObjectId } from "mongodb";

export type ScheduledVideo = {
  id: string;
  caption: string;
  fileUrl: string;
  scheduledDate: string;
};

const dummyQueue: ScheduledVideo[] = [
  {
    id: 'vid001',
    caption: '🏡 Check out this cozy 3-bed home!',
    fileUrl: 'https://your-cdn/video1.mp4',
    scheduledDate: new Date().toISOString().split('T')[0],
  },
];

export async function addToQueue(url: string, type: "user" | "cartoon") {
  return db.collection("video_queue").insertOne({
    url,
    type,
    posted: false,
    uploadedAt: new Date(),
  });
}

export async function getNextUnposted(type: "user" | "cartoon") {
  return db.collection("video_queue").findOne({ type, posted: false });
}

export async function markPosted(videoId: string) {
  return db.collection("video_queue").updateOne(
    { _id: new ObjectId(videoId) },
    { $set: { posted: true } }
  );
}

export async function getTodayScheduledVideos(): Promise<ScheduledVideo[]> {
  const today = new Date().toISOString().split('T')[0];
  return dummyQueue.filter((v) => v.scheduledDate === today);
} 