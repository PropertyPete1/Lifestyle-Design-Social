import * as Sentry from '@sentry/node';

interface VideoItem {
  title: string;
  url: string;
  type: 'user' | 'cartoon';
}

let pointer = 0;
let queue: VideoItem[] = [];

export function getNextInQueue(): "user" | "cartoon" {
  try {
    const value = pointer % 2 === 0 ? "user" : "cartoon";
    pointer++;
    return value;
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'queueManager', operation: 'getNextInQueue' }
    });
    throw err;
  }
}

export function resetQueue() {
  try {
    pointer = 0;
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'queueManager', operation: 'resetQueue' }
    });
    throw err;
  }
}

export async function enqueueVideo(video: VideoItem) {
  try {
    queue.push(video);
    return video;
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'queueManager', operation: 'enqueueVideo' },
      extra: { videoTitle: video.title, videoType: video.type }
    });
    throw err;
  }
}

export function getQueue() {
  try {
    return queue;
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'queueManager', operation: 'getQueue' }
    });
    throw err;
  }
} 