export async function getPostPerformance(igId: string) {
  // TODO: Use Instagram Insights API
  return {
    likes: Math.floor(Math.random() * 1000),
    comments: Math.floor(Math.random() * 100),
    reach: Math.floor(Math.random() * 5000),
  }
} 