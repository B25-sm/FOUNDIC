# 🚀 Foundic Deployment Guide

This guide will walk you through deploying the Foundic application to production using Vercel (frontend) and Railway (backend).

## 📋 Prerequisites

- GitHub account
- Vercel account
- Railway account
- Firebase project configured
- MongoDB Atlas account (for production database)

## 🔧 Step 1: Prepare for Deployment

### 1.1 Create GitHub Repository
```bash
# If you haven't already, push your code to GitHub
git remote add origin https://github.com/yourusername/foundic.git
git branch -M main
git push -u origin main
```

### 1.2 Environment Variables Setup
Create production environment variables (we'll configure these in the deployment platforms):

**Frontend (Vercel) Environment Variables:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
```

**Backend (Railway) Environment Variables:**
```
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foundic
JWT_SECRET=your-super-secure-production-jwt-secret
CLIENT_URL=https://your-frontend-url.vercel.app
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Connect Repository to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `client` folder as the root directory
5. Framework Preset: Next.js
6. Build Command: `npm run build`
7. Output Directory: `.next`
8. Install Command: `npm install`

### 2.2 Configure Environment Variables
In Vercel project settings → Environment Variables:
1. Add all the frontend environment variables listed above
2. Make sure to set them for Production, Preview, and Development environments

### 2.3 Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### 2.4 Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your frontend will be available at `https://your-project.vercel.app`

## 🚂 Step 3: Deploy Backend to Railway

### 3.1 Create Railway Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the `server` folder as the root directory

### 3.2 Configure Environment Variables
In Railway project → Variables:
1. Add all the backend environment variables listed above
2. Make sure `PORT` is set to `8080` (Railway's default)

### 3.3 Configure Build Settings
Railway should automatically detect your Node.js app. If needed:
1. Build Command: `npm install`
2. Start Command: `npm start`
3. Root Directory: `server`

### 3.4 Deploy
1. Railway will automatically deploy on push to main branch
2. Your backend will be available at `https://your-project.railway.app`

## 🗄️ Step 4: Set Up Production Database

### 4.1 MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist Railway's IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get your connection string
6. Update `MONGODB_URI` in Railway environment variables

### 4.2 Database Collections
The app will automatically create collections when first used:
- `users`
- `posts`
- `chats`
- `notifications`
- `pods`
- `matches`

## 🔥 Step 5: Configure Firebase for Production

### 5.1 Update Firebase Configuration
1. Go to Firebase Console
2. Project Settings → General → Your apps
3. Add your production domains to authorized domains:
   - `your-project.vercel.app`
   - Your custom domain (if any)

### 5.2 Update Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts are readable by authenticated users
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
    
    // Notifications are private to users
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Chats are accessible to participants
    match /chats/{chatId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.participants;
    }
  }
}
```

### 5.3 Firebase Storage CORS (Production)
Update your `client/cors.json` for production:
```json
[
  {
    "origin": ["https://your-project.vercel.app", "https://your-custom-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Range"]
  }
]
```

Apply CORS:
```bash
gsutil cors set cors.json gs://your-firebase-bucket.appspot.com
```

## 🧪 Step 6: Test Deployment

### 6.1 Frontend Testing
1. Visit your Vercel URL
2. Test user authentication
3. Test image uploads
4. Test real-time features

### 6.2 Backend Testing
1. Test API endpoints: `https://your-backend.railway.app/api/health`
2. Test database connections
3. Test email functionality

### 6.3 Integration Testing
1. Test frontend-backend communication
2. Test Firebase integration
3. Test real-time notifications

## 🔄 Step 7: Set Up Continuous Deployment

### 7.1 Automatic Deployments
Both Vercel and Railway automatically deploy when you push to your main branch.

### 7.2 Environment-Specific Deployments
- `main` branch → Production
- `develop` branch → Preview/Staging (configure in platform settings)

## 📊 Step 8: Monitoring and Analytics

### 8.1 Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Monitor performance and usage

### 8.2 Railway Metrics
1. Monitor resource usage in Railway dashboard
2. Set up alerts for high usage

### 8.3 Firebase Analytics
1. Enable Google Analytics in Firebase
2. Monitor user engagement

## 🔒 Step 9: Security Checklist

- [ ] All environment variables are properly set
- [ ] Firebase security rules are configured
- [ ] CORS is properly configured
- [ ] JWT secrets are secure and unique
- [ ] Database access is restricted
- [ ] HTTPS is enabled (automatic with Vercel/Railway)
- [ ] API rate limiting is enabled

## 🐛 Troubleshooting

### Common Issues

**Build Failures:**
- Check build logs in platform dashboards
- Ensure all dependencies are listed in package.json
- Verify environment variables are set correctly

**CORS Errors:**
- Update Firebase Storage CORS configuration
- Check allowed origins in Firebase Auth settings

**Database Connection Issues:**
- Verify MongoDB connection string
- Check IP whitelist in MongoDB Atlas
- Ensure database user has proper permissions

**Authentication Issues:**
- Verify Firebase configuration
- Check authorized domains in Firebase Auth
- Ensure JWT secrets match between frontend and backend

## 📞 Support

If you encounter issues:
1. Check platform-specific documentation (Vercel, Railway, Firebase)
2. Review error logs in platform dashboards
3. Test locally with production environment variables
4. Check Firebase project configuration

## 🎉 Success!

Your Foundic app should now be deployed and running in production! 

**Frontend URL:** `https://your-project.vercel.app`
**Backend URL:** `https://your-project.railway.app`

Remember to:
- Monitor performance and usage
- Keep dependencies updated
- Regularly backup your database
- Monitor error logs and fix issues promptly
