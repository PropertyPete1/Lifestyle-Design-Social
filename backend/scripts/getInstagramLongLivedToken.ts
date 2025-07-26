// File path: backend/scripts/getInstagramLongLivedToken.ts

// 🛠️ Instructions for Cursor:
// ✅ This script fetches your Instagram long-lived token
// ✅ Then sends it to your backend to store in your database
// ✅ Do NOT save to .env

import axios from 'axios';

async function getLongLivedToken() {
  try {
    const response = await axios.get(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: '1952344705305646',
          client_secret: '03277b2d9d9ae7f177e0091374277ead',
          fb_exchange_token: 'EAAbvpayjjC4BPLh8wE65baGZBnPYsZB6Ry1ZAZBTAf3aS1WhZAdOuikY67CUl2t63jcICaZA1ZCfVZB8XPzuYomRug0GfvTQihmSZBTNs6jyNBYXV3BeUFF6qzZC43d45dhmZAWq0xZAPXrmQZAEE7xxUE7TGteoFIyhGn6OnU7gH0VjvaGAaXqcg8xZBf5LJaCTsYVGh00kSb2qo6qitAmH78EUBh6OSVRONPNpzpLKFVMg1STolaA8CciH3kU7PhkgZDZD'
        }
      }
    );

    const token = response.data.access_token;
    const expiresIn = response.data.expires_in;

    console.log('✅ Token:', token);

    // Send token to backend for saving
    const saveResponse = await axios.post('http://localhost:3001/api/instagram/token/save', {
      token,
      expiresIn,
    });

    console.log('💾 Token saved in DB:', saveResponse.data);
  } catch (error: any) {
    console.error('❌ Failed to get or save token:', error.response?.data || error.message);
  }
}

getLongLivedToken(); 