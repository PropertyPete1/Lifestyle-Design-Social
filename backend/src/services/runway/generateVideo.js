"use strict";
// Temporarily commented out to fix compilation errors
// TODO: Fix Runway integration later
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideo = generateVideo;
/*
import RunwayClient from "@runwayml/sdk";

const runway = new RunwayClient({
  apiKey: process.env.RUNWAY_API_KEY,
});

export async function generateVideo(prompt: string) {
  const result = await runway.run("gen-3-alpha", {
    prompt_text: prompt,
  });
  
  return result;
}
*/
// Temporary placeholder function
async function generateVideo(prompt) {
    throw new Error('Runway integration temporarily disabled for compilation');
}
