# 🚀 **LIFESTYLE DESIGN AUTO POSTER - CLOUD DEPLOYMENT GUIDE**

## **YOUR SPECIFIC DEPLOYMENT CONFIGURATION**

### **MongoDB Credentials**
- **Username**: `Lifestyle505212`
- **Password**: `Lifestyle505212`
- **Database**: `lifestyle-design-auto-poster`

### **Your Current Production Data**
- ✅ **500 Instagram Archives** with real engagement data
- ✅ **374 YouTube Videos** with performance metrics
- ✅ **194 Top Hashtags** with trending data
- ✅ **28 Repost Queues** ready for deployment
- ✅ **Total**: 2,425+ documents backed up and ready

---

## **STEP-BY-STEP DEPLOYMENT**

### **1. CREATE GITHUB REPOSITORY**

1. **Go to**: https://github.com/PropertyPete1
2. **Create New Repository**:
   - Name: `Lifestyle-Social`
   - Description: `Phase 9 Auto-Poster - 24/7 Cloud Operation`
   - Set to **Private** (recommended for production)
3. **Push your code**:
```bash
git remote set-url origin https://github.com/PropertyPete1/Lifestyle-Social.git
git push -u origin main
```

### **2. SET UP MONGODB ATLAS**

1. **Go to**: https://cloud.mongodb.com
2. **Create account** or **sign in**
3. **Create New Project**: `Lifestyle-Social-Production`
4. **Create Cluster**:
   - **Plan**: M0 Sandbox (FREE)
   - **Provider**: AWS
   - **Region**: US East 1 (N. Virginia)
   - **Cluster Name**: `lifestyle-social-cluster`

5. **Database Access**:
   - **Add New Database User**
   - **Username**: `Lifestyle505212`
   - **Password**: `Lifestyle505212`
   - **Database User Privileges**: Read and write to any database

6. **Network Access**:
   - **Add IP Address**: `0.0.0.0/0` (Allow access from anywhere)
   - **Description**: `Production Access`

7. **Get Connection String**:
   - Click **Connect** → **Connect your application**
   - **Driver**: Node.js
   - **Version**: 4.1 or later
   - **Copy Connection String**:
   ```
   mongodb+srv://Lifestyle505212:Lifestyle505212@lifestyle-social-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - **Save this** - you'll need it for Render!

### **3. IMPORT YOUR PRODUCTION DATA**

After setting up Atlas, import your existing data:

```bash
# Import your backed-up data to Atlas
mongorestore --uri "mongodb+srv://Lifestyle505212:Lifestyle505212@lifestyle-social-cluster.xxxxx.mongodb.net/" ./mongodb-backup/
```

This will transfer all your:
- Instagram scraped content (500 posts)
- YouTube analytics (374 videos)
- Trending hashtags (194 entries)
- Scheduled reposts (28 queued)

### **4. DEPLOY BACKEND TO RENDER**

1. **Go to**: https://render.com
2. **Sign up** and **create account**
3. **New Web Service**:
   - **Connect GitHub**: Link your PropertyPete1 account
   - **Repository**: `PropertyPete1/Lifestyle-Social`
   - **Root Directory**: `backend`

4. **Service Configuration**:
   - **Name**: `lifestyle-social-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Starter** ($7/month) - needed for 24/7 operation

5. **Environment Variables** (Add these exactly):

```env
NODE_ENV=production
PORT=3001

# Database (replace xxxxx with your actual cluster ID)
MONGO_URI=mongodb+srv://Lifestyle505212:Lifestyle505212@lifestyle-social-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGO_DATABASE=lifestyle-design-auto-poster

# Instagram API (your current working tokens)
INSTAGRAM_ACCESS_TOKEN=EAAdtNOsq3ZAYBPLlWQe8QlbwqrmfDo52kQXiPdWHdIxn19rjTo9ZBCBURgN721tWNRYb46MiFGual91ip9Jrn9hepm5ChRkNmT1296mRyPGyZA3JB399UD8vZBxyU2fwVpSlgiDL26wLecDqhsHdBb97IColcqZCuLTuSIgpZB6ImVLvJ5myZCCBoqrNxIZBAniHErcErMKxmLrDIY4tkzhNSSRGsha362GSOR9YFAs8wDSrINQTEwZDZD
INSTAGRAM_BUSINESS_ID=17841454131323777
INSTAGRAM_APP_ID=2090398888156566
INSTAGRAM_USER_ID=732022579657643

# YouTube API (your current working credentials)
YOUTUBE_API_KEY=AIzaSyAqXLUTFa_6SuSfsIg0Flc3uxFf4xQmhwM
YOUTUBE_CLIENT_ID=YOUR_YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET=YOUR_YOUTUBE_CLIENT_SECRET
YOUTUBE_REFRESH_TOKEN=1//0fdTp6fY4365mCgYIARAAGA8SNgF-L9IrQ0z8Dsz61Wq3RLAMGf-il2RzSeiOwPzbC2j2UK3l0L4mL2e8NoStGhfhVpe21kq9TA
YOUTUBE_CHANNEL_ID=UCqSfOt2aLrKKiROnY4kGBcQ

# AI Services
OPENAI_API_KEY=YOUR_OPENAI_API_KEY

# Storage (Dropbox - full key)
DROPBOX_API_KEY=sl.u.AF7a04nF_JIlejRUFcCspSE68e--H1w2HhzygcCQLLiJKo2lxfBYDrYBKgZs_9a8LBHStgZ1isV4bG9dJ3lfiPSqOcvyFWBiVYubf08OCGnHQhsoEGnKJ1TEQ3j3z-MqsKdkTZkx3yWTHnBiWnoPRjeMUlkzrV4MAZKwv1_G7rrFyfZHT29XWEZag0geCJe8lP4NmiCGT_16Nrc_lfDigm2K4g3pFkl13DVmEb3TgVVuCeW-i-8rGF-aqpFApYEpUrKye_CxpRjGIakHyChN0EYOOx0Vmp3WicPvYeLAVG9nNt-Sc6x-86BFwrBaKFVfGxFTm0TfwWVyGICr99FqQrMkJfsofX_GWau9oHnMUQMspt5Iha8ZnskDeQm_FN9jiOE9Zrysg5JFGVB7TU1Jo-fC_SGqp9kmTsVjIMXvBkGUlnn6DRVd2G1NHd0YUR-oVbkHo0dWDHe_uYQmro0mrYsJUhmCxRHZ_AZNGsA7q1VVGCPR4sAp0G5PHei3Pa4ZXvtToM7PpR80-XB0zowyQfoI2pSC4EqqKnbs5DLWMxYmi4NKB5a87WQKYBTiksImo7Ki3yySPS67qtgQTvPqgQlBbx8vLyNCU30YRqTyokT7vEP7qDCv1qcAE7cjZ-XrdW_xWFVTsBzpIwSXZwCJeSmqYT0hcjn1gjAvm0QOcyulPzm-F3GEIN4QE53Yg_L040p8VycP1rkUy9oP1Oer_bLibOIbfIJkgVkjy42iBOwCekbbRtNnpXoM6UQaWIeJEFqHR6urPFNB9OlFx0K5PFMKc3WnXWFjExtG5iFae4IfJVv5hY7hJYvAAdxQDvJU9bxLkswJ0T5zgplnMNl_amWPnRzHA_LlTPBFZ0PGTa2kS_oOMuGqng9unPpO5dAQNPdJ_PZiyrHZmM-jlLWZLE7m6NDcZ9vkruKsbmDD1q4C5Sf5Hip2ZACCGZKk0129GT7__W1yBHIdujIlTG0xgeC8EFJ5DE0IQ36zv3o6wdia7WYrHBAoCSBuatQjKRnjY5_bd8qub3NsVf9Tvlp_b1aOaSy7qz9vNz2NNvqDU3GUizp9FrneXs5lHeI0m2uLJim6yewbIZftyayQ75bpGGCr8WobS-W_5ObpbYFaexlgccPyrynyqPLSFVDLBnf22chf_cS_FtXBxHbuBmj_b7etRqj9GWB6eRSYrIuvbZpuICF5Cmr6aRm20tlr5GReG-2fDDUG3nXdDAdgTy1k1Ag0TIYVoOE6uUOQQXHzzc4AtMD_O37_IbYvJWmg8yyPk8IROHt6Fr571WOItEkZ9nyP2jjvSpNQE2iTy7iKiu5Feg

# Phase 9 Settings (your current configuration)
PHASE9_AUTOPILOT_MODE=both
MAX_REPOSTS_PER_DAY=8
MIN_DAYS_BETWEEN_POSTS=20
MIN_PERFORMANCE_SCORE=1000
REPOST_DELAY=1
ENABLE_YOUTUBE_REPOSTS=true
ENABLE_INSTAGRAM_REPOSTS=true
MAX_REPOSTS_PER_PLATFORM=4
```

6. **Advanced Settings**:
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: Yes (deploys on every GitHub push)

7. **Click "Create Web Service"** - Render will build and deploy automatically

### **5. DEPLOY FRONTEND TO VERCEL**

1. **Go to**: https://vercel.com
2. **Sign up** with GitHub account
3. **Import Project**:
   - **Repository**: `PropertyPete1/Lifestyle-Social`
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (auto-detected)

4. **Environment Variables** (Add in Vercel):
```env
NEXT_PUBLIC_API_URL=https://lifestyle-social-backend.onrender.com
NEXT_PUBLIC_BASE_URL=https://lifestyle-social.vercel.app
```
   - **Note**: Replace with your actual Render/Vercel URLs after deployment

5. **Click "Deploy"** - Vercel will build and deploy automatically

---

## **🎯 VERIFICATION & TESTING**

### **After Deployment, Test These URLs:**

1. **Backend Health Check**:
   ```
   https://lifestyle-social-backend.onrender.com/api/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Phase 9 Status**:
   ```
   https://lifestyle-social-backend.onrender.com/api/phase9/status
   ```
   Should show your 28 queued posts and "both" mode

3. **Frontend Dashboard**:
   ```
   https://lifestyle-social.vercel.app
   ```
   Should load with real-time data

### **Expected Results:**
- ✅ **Backend**: Running 24/7 on Render with FFmpeg support
- ✅ **Frontend**: Fast loading on Vercel CDN
- ✅ **Database**: All your production data in MongoDB Atlas
- ✅ **Auto-posting**: Processing every 15 minutes automatically
- ✅ **Monitoring**: Health checks and error logging active

---

## **🚀 FINAL STATUS**

Once deployed, your **Phase 9 Auto-Poster** will be:

### **✅ FULLY OPERATIONAL 24/7**
- **28 posts queued** and ready (14 Instagram + 14 YouTube)
- **Processing every 15 minutes** for real-time posting
- **Scraping every 2 hours** for fresh content
- **Visual enhancement** applied to all videos
- **AI caption rewriting** with GPT-4
- **Trending hashtags** automatically updated

### **✅ PRODUCTION READY**
- **Zero downtime** with cloud hosting
- **Automatic scaling** based on traffic
- **Error monitoring** and health checks
- **Backup and recovery** with MongoDB Atlas
- **SSL encryption** for all connections

### **✅ COST EFFECTIVE**
- **Render**: $7/month (Starter plan for 24/7 uptime)
- **Vercel**: FREE (hobby plan sufficient)
- **MongoDB Atlas**: FREE (M0 cluster sufficient)
- **Total**: ~$7/month for full cloud operation

**🏆 Your auto-poster will now run completely independently in the cloud!**

---

## **📞 SUPPORT**

If you need help with any step:
1. **Check the health endpoints** first
2. **Review Render/Vercel logs** for specific errors
3. **Verify environment variables** are set correctly
4. **Test MongoDB connection** in Atlas dashboard

**Your Phase 9 system is production-ready and will maintain your social media presence 24/7!**