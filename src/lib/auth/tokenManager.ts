import { db } from "../db/mongoClient";

export async function getInstagramToken(): Promise<string> {
  const account = await db.collection("auth").findOne({ platform: "instagram" });
  if (!account) throw new Error("No Instagram token found.");
  return account.accessToken;
}

export async function getInstagramUserId(): Promise<string> {
  const account = await db.collection("auth").findOne({ platform: "instagram" });
  if (!account) throw new Error("No Instagram user ID found.");
  return account.userId;
} 