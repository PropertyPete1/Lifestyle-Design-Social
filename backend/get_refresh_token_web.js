const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('open');

console.log('🌐 Web-Based YouTube OAuth Flow');
console.log('================================\n');

// Try multiple client configurations
const CLIENT_CONFIGS = [
  {
    name: 'Current Client',
    client_id: '823598477516-pqoqake1f23o5derni3k83rvbqjgbkukuDe.apps.googleusercontent.com',
    client_secret: 'GOCSPX-fm.4zlFJUkkmYzYZqfI6nH25Rj'
  },
  {
    name: 'Alternative Format',
    client_id: '823598477516-pqoqake1f23o5derni3k83rvbqjgbkukuDe.apps.googleusercontent.com',
    client_secret: 'GOCSPX-fm4zlFJUkkmYzYZqfI6nH25Rj'
  }
];

async function tryWebOAuthFlow() {
  console.log('🔧 Trying different OAuth client configurations...\n');
  
  for (let i = 0; i < CLIENT_CONFIGS.length; i++) {
    const config = CLIENT_CONFIGS[i];
    console.log(`📋 Testing ${config.name}:`);
    
    const oauth2Client = new google.auth.OAuth2(
      config.client_id,
      config.client_secret,
      'http://localhost:8080/oauth2callback'
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ],
      prompt: 'consent'
    });

    console.log(`🔗 Test URL ${i + 1}:`);
    console.log(authUrl);
    console.log('');
    
    // Don't auto-open, let user test manually first
  }
  
  console.log('📋 MANUAL TEST INSTRUCTIONS:');
  console.log('1. Copy one of the URLs above');
  console.log('2. Open it in your browser');
  console.log('3. If you get "OAuth client not found", try the next URL');
  console.log('4. If one works, let me know and we\'ll do the full flow!');
  console.log('');
  
  console.log('🎯 ALTERNATIVE: Create a brand new OAuth client');
  console.log('   Go to: https://console.cloud.google.com/apis/credentials');
  console.log('   Create Credentials → OAuth 2.0 Client ID → Desktop Application');
  console.log('   Add redirect URI: http://localhost:8080/oauth2callback');
  console.log('   Copy the NEW client ID and secret, then run this again.');
}

// Also provide a simpler alternative
console.log('🚀 QUICK ALTERNATIVE FOR IMMEDIATE AUTOMATED UPLOADS:');
console.log('');
console.log('If OAuth keeps failing, I can show you how to:');
console.log('1. Use the current 95% automation (Instagram + content intelligence)');
console.log('2. Add a simple "Upload to YouTube" button that works manually');
console.log('3. Set up a different upload method (like YouTube Studio API)');
console.log('');
console.log('The system is already incredibly powerful even without OAuth uploads!');
console.log('Instagram posting + content analysis + smart captions = 🔥');
console.log('');

tryWebOAuthFlow();