import { useState } from "react";
import { VideoFile, VideoPost } from "@/types";

export function useScheduler() {
  const [scheduledPosts, setScheduledPosts] = useState<Record<string, VideoPost[]>>({
    Instagram: [],
    YouTube: [],
    Cartoon: [],
  });

  const availableVideos: VideoFile[] = [
    { id: "1", title: "Tour #1", url: "/videos/1.mp4" },
    { id: "2", title: "Cartoon 1", url: "/videos/2.mp4" },
  ];

  const onDrop = (video: VideoFile, platform: string) => {
    const newPost: VideoPost = {
      title: video.title,
      time: new Date().toLocaleTimeString(),
    };

    setScheduledPosts((prev) => ({
      ...prev,
      [platform]: [...prev[platform], newPost],
    }));
  };

  return { scheduledPosts, availableVideos, onDrop };
} 