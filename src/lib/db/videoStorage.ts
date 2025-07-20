import { db } from "./mongoClient";

export async function getUnpostedUserVideos() {
  return db.collection("videos").find({ type: "user", posted: false }).toArray();
}

export async function getCartoonVideos() {
  return db.collection("videos").find({ type: "cartoon", posted: false }).toArray();
}

export async function markVideoAsPosted(id: string) {
  return db.collection("videos").updateOne({ _id: id }, { $set: { posted: true, postedAt: new Date() } });
} 