# 🔧 Vercel Environment Variables Configuration

## Add these EXACT variables in Vercel Dashboard → Settings → Environment Variables:

### **Essential Frontend Variables:**
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://lifestyle-design-social.onrender.com
NEXT_PUBLIC_FRONTEND_URL=https://lifestyle-design-social.vercel.app
NEXT_PUBLIC_APP_NAME=Lifestyle Design Social
NEXT_PUBLIC_APP_DESCRIPTION=AI-powered real estate auto-posting application
```

### **API Configuration:**
```
NEXT_PUBLIC_CORS_ORIGIN=https://lifestyle-design-social.vercel.app
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_DEBUG=false
```

### **MongoDB (for client-side connection if needed):**
```
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/auto_posting_app?retryWrites=true&w=majority
```

### **Security:**
```
JWT_SECRET=your-production-jwt-secret-minimum-32-characters
```

## 🎯 How to Add in Vercel:

1. Go to: https://vercel.com/peter-allens-projects/lifestyle-design-social
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in sidebar
4. For each variable above:
   - **Name**: Enter the variable name (e.g., NODE_ENV)
   - **Value**: Enter the value (e.g., production)
   - **Environment**: Select "Production, Preview, and Development"
   - Click **"Save"**

## 🔄 After Adding Variables:

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Your frontend will rebuild with the correct backend connection

Your frontend will then be live at: **https://lifestyle-design-social.vercel.app** 