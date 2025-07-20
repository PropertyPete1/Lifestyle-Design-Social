import axios from "axios";
import { db } from "../db/mongoClient";
import { getInstagramToken, getInstagramUserId } from "../auth/tokenManager";

export async function syncInstagramPosts() {
  const token = await getInstagramToken();
  const userId = await getInstagramUserId();

  const res = await axios.get(`https://graph.facebook.com/v18.0/${userId}/media`, {
    params: {
      fields: "caption,timestamp",
      access_token: token,
      limit: 100,
    },
  });

  const posts = res.data.data;
  for (const post of posts) {
    if (post.caption) {
      await db.collection("captions").updateOne(
        { text: post.caption },
        { $setOnInsert: { text: post.caption, createdAt: new Date(post.timestamp) } },
        { upsert: true }
      );
    }
  }
} 