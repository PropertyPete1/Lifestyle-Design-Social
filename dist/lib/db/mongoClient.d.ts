import { MongoClient } from "mongodb";
declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}
export declare const db: import("mongodb").Db;
//# sourceMappingURL=mongoClient.d.ts.map