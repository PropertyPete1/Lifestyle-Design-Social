import axios from 'axios';

async function getLongLivedToken() {
  try {
    const response = await axios.get(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: '2090398888156566', // Lifestyle Design Social App ID
          client_secret: '4112c14a5aab0e9ec0305a26db826626', // Lifestyle Design Social App Secret
          fb_exchange_token: 'EAAdtNOsq3ZAYBPAuZCH90BgZAavz3qy5ncKvyz88m3demwhYhSPEURKWZAGfm2Aq7ZBILagunlz7lt4brHknU1xaJKXCiPzc6cxEDWn33q2hlLeTHHjUWliHIWOLKxPuourBArPBsF8KSPQhc8Kddq4P3nNuzdee9WDpBdecMC9FgZBlm9bwZA2Kr2dgnokyZBTLO5Y5nDw1u1XjlbhpXU9MaY0VhYiJk8WuiWVALuEtr1mHyhWVucTdPgWLuZAEZD'
        },
      }
    );

    const token = response.data.access_token;
    const expiresIn = response.data.expires_in;

    console.log('✅ Long-lived token:', token);
    console.log('🕒 Expires in (seconds):', expiresIn);
    console.log('📅 Expires in (days):', Math.floor(expiresIn / 86400));
    
    console.log('\n📋 Copy this token to backend/settings.json:');
    console.log(`"instagramAccessToken": "${token}"`);
    
  } catch (error: any) {
    console.error('❌ Failed to fetch long-lived token:', error.response?.data || error.message);
  }
}

getLongLivedToken(); 