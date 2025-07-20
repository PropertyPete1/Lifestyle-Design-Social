"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const mongodb_1 = require("mongodb");
const uri = process.env.MONGODB_URI;
const client = new mongodb_1.MongoClient(uri);
exports.db = client.db("lifestyle_design_social");
if (!global._mongoClientPromise) {
    global._mongoClientPromise = client.connect();
}
//# sourceMappingURL=mongoClient.js.map