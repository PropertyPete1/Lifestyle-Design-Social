import { refreshInstagramToken } from './refreshToken';
import { getDb } from '../mongo';
import dayjs from 'dayjs';

const THRESHOLD_DAYS = 50;

export async function checkAndRefreshInstagramTokens() {
  const db = await getDb();
  const accounts = await db.collection('socialAccounts').find({ platform: 'instagram' }).toArray();

  for (const account of accounts) {
    const lastUpdated = dayjs(account.token_last_refreshed);
    const now = dayjs();
    const daysSinceRefresh = now.diff(lastUpdated, 'day');

    if (daysSinceRefresh > THRESHOLD_DAYS) {
      console.log(`Refreshing token for user ${account.user_id}`);
      try {
        const refreshed = await refreshInstagramToken(account.access_token);

        await db.collection('socialAccounts').updateOne(
          { _id: account._id },
          {
            $set: {
              access_token: refreshed.access_token,
              token_last_refreshed: new Date(),
            },
          }
        );
      } catch (err) {
        console.error(`Failed to refresh token for user ${account.user_id}:`, err);
      }
    }
  }
} 