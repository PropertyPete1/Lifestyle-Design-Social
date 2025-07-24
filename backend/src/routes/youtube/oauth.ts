import express from 'express'
import axios from 'axios'
import querystring from 'querystring'
import fs from 'fs'
import path from 'path'

const router = express.Router()

// Function to get credentials from settings
function getCredentials() {
  const settingsPath = path.resolve(__dirname, '../../../../frontend/settings.json');
  let clientId = process.env.GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = 'http://localhost:3001/api/youtube/oauth/callback';

  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      clientId = settings.youtubeClientId || clientId;
      clientSecret = settings.youtubeClientSecret || clientSecret;
    } catch (e) {
      // Ignore parse errors
    }
  }

  return { clientId, clientSecret, redirectUri };
}

router.get('/initiate', (req, res) => {
  const { clientId, clientSecret, redirectUri } = getCredentials();
  
  if (!clientId) {
    return res.status(400).send('❌ YouTube Client ID not configured. Please add it in Settings.');
  }
  
  const params = querystring.stringify({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.upload',
    access_type: 'offline',
    prompt: 'consent',
  })
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

// Instructions page for manual OAuth flow
router.get('/instructions', (req, res) => {
  res.send(`
    <html>
      <head><title>YouTube OAuth Setup</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h2>🔐 YouTube OAuth Setup</h2>
        <p>Since we're using a desktop application flow, please follow these steps:</p>
        <ol>
          <li><strong>Step 1:</strong> <a href="/api/youtube/oauth/initiate" target="_blank" style="color: #1976d2;">Click here to authorize</a></li>
          <li><strong>Step 2:</strong> Google will show you an authorization code on the page</li>
          <li><strong>Step 3:</strong> Copy that code and paste it below:</li>
        </ol>
        
        <form id="tokenForm" style="margin: 20px 0;">
          <label>Authorization Code:</label><br>
          <textarea id="authCode" placeholder="Paste the full authorization code here" style="width: 100%; height: 100px; padding: 8px; margin: 5px 0;"></textarea><br>
          <button type="submit" style="background: #1976d2; color: white; padding: 10px 20px; border: none; cursor: pointer;">Get Refresh Token</button>
        </form>
        
        <div id="result" style="margin: 20px 0; padding: 15px; border-radius: 5px;"></div>
        
        <script>
          document.getElementById('tokenForm').onsubmit = async (e) => {
            e.preventDefault();
            const code = document.getElementById('authCode').value.trim();
            const result = document.getElementById('result');
            
            if (!code) {
              result.innerHTML = '❌ Please enter the authorization code';
              result.style.background = '#ffebee';
              return;
            }
            
            result.innerHTML = '⏳ Exchanging code for refresh token...';
            result.style.background = '#e3f2fd';
            
            try {
              const response = await fetch('/api/youtube/oauth/exchange-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
              });
              
              const data = await response.json();
              
              if (data.success) {
                result.innerHTML = \`
                  <h3 style="color: #28a745;">✅ Success!</h3>
                  <p><strong>Your Refresh Token:</strong></p>
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #ddd; word-break: break-all; font-family: monospace; font-size: 12px;">
                    \${data.refresh_token}
                  </div>
                  <p style="margin-top: 15px;"><strong>Next Steps:</strong></p>
                  <ol>
                    <li>Copy the refresh token above</li>
                    <li>Go to your Settings page</li>
                    <li>Paste it in the "YouTube Refresh Token" field</li>
                    <li>Save your settings</li>
                  </ol>
                \`;
                result.style.background = '#d4edda';
              } else {
                throw new Error(data.error || 'Unknown error');
              }
            } catch (error) {
              result.innerHTML = \`❌ Error: \${error.message}\`;
              result.style.background = '#f8d7da';
            }
          };
        </script>
      </body>
    </html>
  `);
});

// Exchange authorization code for tokens
router.post('/exchange-code', async (req, res) => {
  const { code } = req.body;
  const { clientId, clientSecret, redirectUri } = getCredentials();

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'YouTube OAuth credentials not configured. Please add them in Settings.' });
  }

  try {
    console.log('Exchanging code for tokens...');
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code: code.trim(),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const { refresh_token, access_token } = tokenRes.data;
    
    if (!refresh_token) {
      throw new Error('No refresh token returned. Make sure you granted offline access.');
    }
    
    console.log('✅ REFRESH TOKEN obtained:', refresh_token);
    
    res.json({ 
      success: true, 
      refresh_token,
      message: 'Copy this refresh token to your Settings!' 
    });
  } catch (err: any) {
    console.error('Token exchange error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to exchange authorization code for tokens',
      details: err.response?.data || err.message 
    });
  }
});

router.get('/callback', async (req, res) => {
  const code = req.query.code as string
  const { clientId, clientSecret, redirectUri } = getCredentials();

  if (!clientId || !clientSecret) {
    return res.status(400).send('❌ YouTube OAuth credentials not configured. Please add Client ID and Client Secret in Settings.');
  }

  try {
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    })

    const { refresh_token } = tokenRes.data
    console.log('✅ REFRESH TOKEN:', refresh_token)
    res.send(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
        <h2 style="color: #28a745;">✅ Success!</h2>
        <p>Your YouTube Refresh Token:</p>
        <div style="background: #fff; padding: 15px; border-radius: 5px; border: 1px solid #ddd; word-break: break-all; font-family: monospace;">
          ${refresh_token}
        </div>
        <p style="margin-top: 20px; color: #6c757d;">Copy this token and paste it into the "YouTube Refresh Token" field in your Settings page.</p>
      </div>
    `)
  } catch (err: any) {
    console.error(err.response?.data || err.message)
    res.status(500).send('❌ Error retrieving tokens.')
  }
})

export default router 