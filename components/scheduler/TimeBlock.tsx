import React from "react";
import { useDrop } from "react-dnd";
import { VideoFile } from "@/types";

interface Props {
  platform: string;
  onDrop: (video: VideoFile, platform: string) => void;
}

export default function TimeBlock({ platform, onDrop }: Props) {
  const [, dropRef] = useDrop({
    accept: "VIDEO",
    drop: (item: VideoFile) => onDrop(item, platform),
  });

  return (
    <div
      ref={dropRef}
      className="w-full h-32 bg-gray-700 hover:bg-gray-600 border-dashed border-2 border-indigo-500 flex items-center justify-center rounded-md transition"
    >
      <p className="text-gray-300">Drop video here to schedule</p>
    </div>
  );
} 