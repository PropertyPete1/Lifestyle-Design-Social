"use client";

import { useState } from "react";
import { useScheduler } from "@/hooks/useScheduler";
import VideoSlot from "./VideoSlot";
import TimeBlock from "./TimeBlock";

export default function SchedulerView() {
  const { scheduledPosts, availableVideos, onDrop } = useScheduler();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {["Instagram", "YouTube", "Cartoon"].map((platform) => (
        <div key={platform}>
          <h2 className="text-lg text-white mb-2">{platform}</h2>
          <div className="space-y-4 bg-gray-800 p-4 rounded-lg min-h-[500px]">
            {scheduledPosts[platform]?.map((slot, idx) => (
              <VideoSlot key={idx} {...slot} />
            ))}
            <TimeBlock platform={platform} onDrop={onDrop} />
          </div>
        </div>
      ))}
    </div>
  );
} 