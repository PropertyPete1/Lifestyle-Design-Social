import fetch from 'node-fetch';
import * as Sentry from '@sentry/node';

const INSTAGRAM_USER_ID = process.env.IG_USER_ID!;
const ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN!;

export async function scrapeRecentCaptions(): Promise<string[]> {
  try {
    const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=caption,timestamp,like_count&access_token=${ACCESS_TOKEN}&limit=50`;

    const res = await fetch(url);
    const json = await res.json();

    if (!json.data) return [];

    return json.data
      .filter((item: any) => item.caption && item.like_count > 0)
      .sort((a: any, b: any) => b.like_count - a.like_count)
      .slice(0, 20)
      .map((item: any) => item.caption.trim());
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'scrapeCaptions', api: 'instagram' },
      extra: { userId: INSTAGRAM_USER_ID }
    });
    throw err;
  }
} 