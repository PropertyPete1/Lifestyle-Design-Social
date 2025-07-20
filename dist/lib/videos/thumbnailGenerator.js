"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateThumbnail = generateThumbnail;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
function generateThumbnail(videoPath, outDir) {
    const output = path_1.default.join(outDir, `${Date.now()}-thumb.jpg`);
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(videoPath)
            .on("end", () => resolve(output))
            .on("error", reject)
            .screenshots({
            count: 1,
            folder: outDir,
            filename: path_1.default.basename(output),
            size: "640x?",
        });
    });
}
//# sourceMappingURL=thumbnailGenerator.js.map