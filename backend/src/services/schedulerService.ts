import { VideoModel } from '../models/Video';
import { generateImprovedCaption } from './captionService';
import { fetchInstagramCaptions } from '../integrations/instagram';
import { isCartoonVideo } from '../utils/videoUtils';

let lastPostedWasCartoon = false;

export async function processNextScheduledVideo() {
  const nextVideo = await VideoModel.findOne({ status: 'scheduled' }).sort({ scheduledTime: 1 });
  if (!nextVideo) return;

  // 1. Cartoon alternation enforcement
  const shouldBeCartoon = lastPostedWasCartoon ? false : true;
  if (shouldBeCartoon && !isCartoonVideo(nextVideo)) return; // skip non-cartoon
  if (!shouldBeCartoon && isCartoonVideo(nextVideo)) return; // skip cartoon

  // 2. Check for repost caption matching
  const existingCaption = await fetchInstagramCaptions(nextVideo);
  const improvedCaption = await generateImprovedCaption(existingCaption || nextVideo.caption || '');

  // 3. Save upgraded caption
  nextVideo.caption = improvedCaption;
  await nextVideo.save();

  // 4. Publish to Instagram or YouTube
  if (nextVideo.platform === 'instagram') {
    const { publishToInstagram } = await import('../integrations/instagram');
    await publishToInstagram(nextVideo);
  } else if (nextVideo.platform === 'youtube') {
    const { publishToYouTube } = await import('../integrations/youtube');
    await publishToYouTube(nextVideo);
  }

  // 5. Mark as posted + update alternation flag
  nextVideo.status = 'posted';
  await nextVideo.save();
  lastPostedWasCartoon = isCartoonVideo(nextVideo);
}
