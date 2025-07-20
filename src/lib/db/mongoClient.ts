import { MongoClient } from "mongodb";
import * as Sentry from '@sentry/node';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;
let client: MongoClient | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  try {
    if (!client) {
      client = new MongoClient(uri);
      await client.connect();
    }
    return client;
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'mongoClient', operation: 'getMongoClient' },
      extra: { uri: uri ? '***' : 'undefined' }
    });
    throw err;
  }
}

// Legacy export for backward compatibility
const legacyClient = new MongoClient(uri);
export const db = legacyClient.db("lifestyle_design_social");

if (!global._mongoClientPromise) {
  global._mongoClientPromise = legacyClient.connect().catch(err => {
    Sentry.captureException(err, {
      tags: { component: 'mongoClient', operation: 'legacyConnect' },
      extra: { uri: uri ? '***' : 'undefined' }
    });
    throw err;
  });
} 