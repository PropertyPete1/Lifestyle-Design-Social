"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUploadedVideos = registerUploadedVideos;
const mongoClient_1 = require("../db/mongoClient");
async function registerUploadedVideos(fileList) {
    if (fileList.length > 30)
        throw new Error("Too many files. Max allowed is 30.");
    const toInsert = fileList.map((file) => ({
        ...file,
        posted: false,
        uploadedAt: new Date(),
    }));
    return mongoClient_1.db.collection("videos").insertMany(toInsert);
}
//# sourceMappingURL=bulkUploader.js.map