"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mimicCaption = mimicCaption;
const analyzeTopCaptions_1 = require("./analyzeTopCaptions");
const generateStylePrompt_1 = require("./generateStylePrompt");
const callOpenAI_1 = require("../ai/callOpenAI");
async function mimicCaption(videoTopic) {
    const topCaptions = await (0, analyzeTopCaptions_1.analyzeTopCaptions)();
    const prompt = (0, generateStylePrompt_1.generateStylePrompt)(topCaptions, videoTopic);
    const response = await (0, callOpenAI_1.callOpenAI)(prompt);
    return response.trim();
}
//# sourceMappingURL=mimicCaption.js.map