type SchedulePostPayload = {
  videoUrl: string;
  caption: string;
  scheduledTime: string;
  platform: 'instagram' | 'youtube';
};

export async function queuePost(post: SchedulePostPayload) {
  console.log('Queueing post for scheduling', post);
} 