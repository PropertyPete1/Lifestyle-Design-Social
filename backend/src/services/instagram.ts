import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.resolve(__dirname, '../../../frontend/settings.json');
let accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
let businessId = process.env.INSTAGRAM_BUSINESS_ID || '';

if ((!accessToken || !businessId) && fs.existsSync(settingsPath)) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    accessToken = accessToken || settings.instagramAccessToken || '';
    businessId = businessId || settings.instagramBusinessId || '';
  } catch (e) {
    console.error('Failed to read Instagram credentials from settings.json:', e);
  }
}

if (!accessToken || !businessId) {
  throw new Error('Instagram access token or business ID not set in environment or settings.json');
}

const BASE_URL = 'https://graph.facebook.com/v19.0';

export async function fetchInstagramPosts(limit = 100) {
  const url = `${BASE_URL}/${businessId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Instagram API error:', res.status, errorText);
    throw new Error(`Failed to fetch Instagram posts: ${res.statusText} - ${errorText}`);
  }
  const data = await res.json();
  return data && typeof data === 'object' && 'data' in data ? (data as any).data : [];
}

export async function fetchInstagramInsights(mediaId: string) {
  const url = `${BASE_URL}/${mediaId}/insights?metric=impressions,reach,engagement,saved,video_views&access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch insights for ${mediaId}: ${res.statusText}`);
  const data = await res.json();
  return data && typeof data === 'object' && 'data' in data ? (data as any).data : [];
} 