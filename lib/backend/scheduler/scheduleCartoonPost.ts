import { getNextOptimalTime } from '../utils/postingUtils';
import { getCartoonVideos, markVideoAsPosted } from '../db/videoHelpers';
import { createPostDraft } from '../services/instagramService';
import { insertPostSchedule } from '../db/scheduleHelpers';

let lastWasCartoon = false;

export async function scheduleCartoonPost() {
  const now = new Date();
  const scheduledTime = getNextOptimalTime(now);

  lastWasCartoon = !lastWasCartoon;
  if (!lastWasCartoon) return; // Skip this round if alternating logic says it's not cartoon's turn

  const cartoonVideos = await getCartoonVideos();
  if (!cartoonVideos.length) return;

  const selectedVideo = cartoonVideos[0];

  await createPostDraft({
    videoUrl: selectedVideo.url,
    caption: selectedVideo.caption,
    scheduledFor: scheduledTime,
    platform: 'instagram',
    type: 'cartoon',
  });

  await insertPostSchedule({
    videoId: selectedVideo.id,
    scheduledTime,
    type: 'cartoon',
  });

  await markVideoAsPosted(selectedVideo.id);
} 