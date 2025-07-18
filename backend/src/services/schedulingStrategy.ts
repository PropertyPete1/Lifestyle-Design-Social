import { VideoModel } from '../models/Video';
import { bestTimeToPostService } from './bestTimeToPostService';
import { isCartoonVideo } from '../utils/videoUtils';
import mongoose from 'mongoose';

let lastWasCartoon = false;

/**
 * Automatically schedules the next batch of videos for posting
 * Schedules 3 daily posts based on best audience times with alternating cartoon logic
 */
export async function autoScheduleNextBatch() {
  const videos = await VideoModel.find({ status: 'draft' }).sort({ createdAt: 1 });
  if (!videos.length) return;

  // Get optimal posting times for Instagram
  const optimalTimes = await bestTimeToPostService.getOptimalPostingTimes('instagram', 30);
  if (!optimalTimes.length) return;

  const today = new Date();
  let scheduleIndex = 0;

  for (let i = 0; i < videos.length && scheduleIndex < optimalTimes.length; i++) {
    const video = videos[i];

    // Skip if it violates alternation logic
    const isCartoon = isCartoonVideo(video);
    const shouldBeCartoon = !lastWasCartoon;
    if (shouldBeCartoon !== isCartoon) continue;

    const postTime = new Date(today);
    postTime.setUTCHours(optimalTimes[scheduleIndex].hour, optimalTimes[scheduleIndex].minute, 0);

    video.scheduledFor = postTime;
    video.status = 'scheduled';
    await video.save();

    lastWasCartoon = isCartoon;
    scheduleIndex++;
  }
} 