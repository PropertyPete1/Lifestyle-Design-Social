import { VideoPost } from "@/types";
import React from "react";

export default function VideoSlot({ title, time }: VideoPost) {
  return (
    <div className="bg-indigo-700 text-white px-4 py-2 rounded-md shadow-md">
      <p className="font-bold">{title}</p>
      <p className="text-sm text-gray-200">{time}</p>
    </div>
  );
} 