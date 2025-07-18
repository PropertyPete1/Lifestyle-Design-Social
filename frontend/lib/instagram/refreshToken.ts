import axios from 'axios';

/**
 * Refreshes a long-lived Instagram token and returns the new token + expiry.
 * Call this every 55 days to avoid expiration.
 */
export async function refreshInstagramToken(oldToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  try {
    const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
      params: {
        grant_type: 'ig_refresh_token',
        access_token: oldToken,
      },
    });

    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
    };
  } catch (error) {
    console.error('Failed to refresh Instagram token:', error);
    throw new Error('Could not refresh Instagram token');
  }
} 