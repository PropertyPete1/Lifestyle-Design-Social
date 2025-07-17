# 🚀 Real Estate Auto-Posting App - Deployment Guide

## 📋 Pre-Deployment Checklist

✅ TypeScript codebase is complete and error-free  
✅ All services tested locally  
✅ Environment variables configured  
✅ Code committed to Git repository  

---

## 🌟 **OPTION 1: Deploy Frontend to Vercel**

### Step 1: Prepare Vercel Deployment

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Navigate to frontend directory**:
```bash
cd frontend
```

4. **Initialize Vercel project**:
```bash
vercel
```

### Step 2: Configure Vercel Environment Variables

In your Vercel dashboard, add these environment variables:

```env
# Essential Variables
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-domain.onrender.com
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app

# AI Services
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_RUNWAYML_API_KEY=your-runwayml-api-key

# Social Media APIs
NEXT_PUBLIC_INSTAGRAM_APP_ID=your-instagram-app-id
NEXT_PUBLIC_TIKTOK_CLIENT_KEY=your-tiktok-client-key
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your-youtube-client-id

# Database
MONGODB_URI=your-mongodb-connection-string

# Security
JWT_SECRET=your-production-jwt-secret-32-chars-minimum
```

### Step 3: Deploy to Vercel

```bash
# From the frontend directory
vercel --prod
```

**Expected result**: Your frontend will be deployed to `https://your-app.vercel.app`

---

## 🔧 **OPTION 2: Deploy Backend to Render**

### Step 1: Create Render Account & Service

1. Go to [render.com](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Choose **"Build and deploy from a Git repository"**

### Step 2: Configure Render Build Settings

**Build Settings:**
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`
- **Environment**: `Node`
- **Root Directory**: `/` (leave blank to use repo root)

**Advanced Settings:**
- **Auto-Deploy**: `Yes`
- **Branch**: `main`

### Step 3: Configure Render Environment Variables

Add these environment variables in Render dashboard:

```env
# Server Configuration
NODE_ENV=production
PORT=5001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auto_posting_prod

# JWT
JWT_SECRET=your-production-jwt-secret-minimum-32-characters

# AI Services
OPENAI_API_KEY=your-openai-api-key
RUNWAYML_API_KEY=your-runwayml-api-key
STABILITY_API_KEY=your-stability-api-key

# Social Media APIs
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret

# CORS
CORS_ORIGINS=https://your-app.vercel.app

# Feature Flags
AI_SERVICES_ENABLED=true
CARTOON_GENERATION_ENABLED=true
MULTI_PLATFORM_POSTING=true
```

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your backend
3. Your backend will be available at `https://your-app.onrender.com`

---

## 🔗 **Connect Frontend & Backend**

### Update Frontend Environment Variables

In Vercel dashboard, update:
```env
NEXT_PUBLIC_API_URL=https://your-backend-name.onrender.com
```

### Update Backend CORS

In Render dashboard, update:
```env
CORS_ORIGINS=https://your-frontend-name.vercel.app
```

---

## 📱 **OPTION 3: Alternative GitHub Pages + Railway**

### Frontend → GitHub Pages
```bash
cd frontend
npm run build
npm install -g gh-pages
gh-pages -d build
```

### Backend → Railway
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Deploy backend with same environment variables as Render

---

## 🖥️ **OPTION 4: Desktop App (Electron)**

### Build Desktop App
```bash
# Install Electron globally
npm install -g electron

# Build the app
npm run electron:prod

# Package for distribution
npm install -g electron-builder
electron-builder
```

**Result**: Creates installable desktop app for Windows/Mac/Linux

---

## 🎯 **Post-Deployment Verification**

### Test Frontend Deployment
1. Visit your Vercel URL
2. Test user registration/login
3. Upload a test video
4. Verify dark theme and styling
5. Test all navigation links

### Test Backend Deployment
1. Visit `https://your-backend.onrender.com/api/health`
2. Should return: `{"status": "ok", "timestamp": "..."}`
3. Test API endpoints with Postman/curl
4. Verify database connection

### Test Full Integration
1. Login to frontend
2. Upload video through frontend
3. Generate captions/hashtags
4. Create cartoon content
5. Schedule posts
6. Check analytics

---

## 🔒 **Security Checklist**

✅ All API keys are in environment variables (not in code)  
✅ JWT_SECRET is 32+ characters and unique  
✅ CORS is configured for your domains only  
✅ HTTPS is enabled on both frontend and backend  
✅ Rate limiting is enabled  
✅ Input validation is implemented  

---

## 🚨 **Troubleshooting**

### Common Issues & Solutions

**Issue**: Build fails on Vercel  
**Solution**: Check `frontend/package.json` dependencies and build script

**Issue**: Backend fails to start on Render  
**Solution**: Verify environment variables and MongoDB connection string

**Issue**: CORS errors  
**Solution**: Update `CORS_ORIGINS` to include both your Vercel and any custom domains

**Issue**: API calls fail  
**Solution**: Check `NEXT_PUBLIC_API_URL` points to your Render backend

**Issue**: Database connection fails  
**Solution**: Verify MongoDB URI and whitelist Render's IP addresses

---

## 📞 **Support Commands**

### Check Logs
```bash
# Vercel logs
vercel logs

# Render logs
# View in Render dashboard → Logs tab
```

### Test API Health
```bash
curl https://your-backend.onrender.com/api/health
```

### Test Frontend Build Locally
```bash
cd frontend
npm run build
npm run start
```

---

## 🎉 **Success!**

After successful deployment:

1. **Frontend**: Available at `https://your-app.vercel.app`
2. **Backend**: Available at `https://your-backend.onrender.com`
3. **Desktop**: Installable Electron app
4. **Mobile**: React Native app ready for App Store/Play Store

Your Real Estate Auto-Posting App is now live in production! 🚀 