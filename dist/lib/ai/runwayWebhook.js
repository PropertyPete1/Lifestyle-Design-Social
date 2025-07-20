"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const mongoClient_1 = require("../db/mongoClient");
async function handler(req, res) {
    const { cartoonUrl, prompt, jobId } = req.body;
    if (!cartoonUrl || !prompt || !jobId) {
        return res.status(400).json({ error: "Missing data" });
    }
    await mongoClient_1.db.collection("cartoon_jobs").updateOne({ jobId }, { $set: { cartoonUrl, completedAt: new Date() } });
    return res.status(200).json({ message: "Cartoon stored." });
}
//# sourceMappingURL=runwayWebhook.js.map