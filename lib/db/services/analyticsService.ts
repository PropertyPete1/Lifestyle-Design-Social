import Analytics from '../models/Analytics';

export async function saveAnalytics(platform: string, metrics: any) {
  const existing = await Analytics.findOne({ platform });
  if (existing) {
    Object.assign(existing, metrics);
    await existing.save();
  } else {
    await Analytics.create({ platform, ...metrics });
  }
} 