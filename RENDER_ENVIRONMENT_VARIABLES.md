# 🔧 Render Backend Environment Variables

## Add/Update these in Render Dashboard → Environment Variables:

### **Essential Backend Variables:**
```
NODE_ENV=production
PORT=5001
JWT_SECRET=128e292d3c403a6f0d235db65647fe360c6e9b6a781b5f69cc69ad518d02ae51
MONGODB_URI=mongodb+srv://peter:xX9Rqal8fY4Ts2NA@cluster0.wpjcz1.mongodb.net/?retryWrites=true&w=majority
```

### **CORS Configuration (PRODUCTION-ONLY):**
```
CORS_ORIGINS=https://lifestyle-design-social.vercel.app
```

### **Performance & Security:**
```
LOG_LEVEL=info
DEBUG_LOGGING=false
ENABLE_DEV_ROUTES=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **Feature Flags:**
```
AI_SERVICES_ENABLED=true
CARTOON_GENERATION_ENABLED=true
MULTI_PLATFORM_POSTING=true
TEST_MODE_ENABLED=false
```

### **Build Settings Verify:**
```
Build Command: cd backend && npm install && npm run build
Start Command: cd backend && node dist/app.js
Root Directory: (leave blank)
```

## 🎯 How to Update Render:

1. Go to your Render dashboard
2. Click on "lifestyle-design-social" service
3. Click **"Environment"** tab
4. Add any missing variables above
5. Click **"Manual Deploy"** to restart with new settings

## 🔄 Expected Result:

Backend will be accessible at: **https://lifestyle-design-social.onrender.com/api/health** 