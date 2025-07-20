interface VideoItem {
  title: string;
  url: string;
  type: 'user' | 'cartoon';
}

let pointer = 0;
let queue: VideoItem[] = [];

export function getNextInQueue(): "user" | "cartoon" {
  const value = pointer % 2 === 0 ? "user" : "cartoon";
  pointer++;
  return value;
}

export function resetQueue() {
  pointer = 0;
}

export async function enqueueVideo(video: VideoItem) {
  queue.push(video);
  return video;
}

export function getQueue() {
  return queue;
} 