import { MongoClient } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;
let client: MongoClient | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

// Legacy export for backward compatibility
const legacyClient = new MongoClient(uri);
export const db = legacyClient.db("lifestyle_design_social");

if (!global._mongoClientPromise) {
  global._mongoClientPromise = legacyClient.connect();
} 