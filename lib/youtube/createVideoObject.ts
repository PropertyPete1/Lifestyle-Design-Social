import { YouTubeVideoPayload } from "./types";

export function createYouTubeVideoObject(payload: YouTubeVideoPayload) {
  return {
    snippet: {
      title: payload.title,
      description: payload.description,
      tags: payload.tags || [],
      categoryId: payload.categoryId || "22",
    },
    status: {
      privacyStatus: "public",
    },
  };
} 