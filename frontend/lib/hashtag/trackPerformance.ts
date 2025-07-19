type HashtagPerformance = {
  hashtag: string;
  impressions: number;
  engagement: number;
};

export function trackPerformance(data: HashtagPerformance) {
  console.log('Tracking hashtag performance', data);
} 