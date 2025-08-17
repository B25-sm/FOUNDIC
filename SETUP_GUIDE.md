# 🚀 Foundic App Setup Guide

## Overview
This guide will help you set up and run the Foundic application successfully. The app consists of a Next.js frontend and an Express.js backend with Firebase integration.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase project setup
- MongoDB (for backend)
- Google Cloud SDK (for CORS configuration)

## 🛠️ Client Setup (Frontend)

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the client directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create or select your project
3. Enable Authentication (Google provider)
4. Enable Firestore Database (start in test mode)
5. Enable Firebase Storage
6. Configure CORS for Storage (see CORS_FIX_GUIDE.md)

### 4. Run Development Server
```bash
npm run dev
```

## 🖥️ Server Setup (Backend)

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Environment Variables
Create a `.env` file in the server directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/foundic
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLIENT_URL=http://localhost:3000
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

### 3. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On macOS with Homebrew
brew services start mongodb/brew/mongodb-community

# On Windows
net start MongoDB

# On Linux
sudo systemctl start mongod
```

### 4. Run Development Server
```bash
npm run dev
```

## 🔧 Common Issues & Solutions

### Firebase Connection Issues
- **Error**: "Could not reach Cloud Firestore backend"
- **Solution**: Check internet connection and Firebase project status
- **Check**: Ensure Firebase project is active and billing is enabled if needed

### CORS Issues with Firebase Storage
- **Error**: "Access blocked by CORS policy"
- **Solution**: Run the CORS configuration command:
```bash
cd client
gsutil cors set cors.json gs://your-bucket-name.appspot.com
```

### Authentication Problems
- **Error**: Google sign-in popup blocked
- **Solution**: Allow popups in browser settings
- **Check**: Ensure Google Auth is enabled in Firebase Console

### Image Upload Failures
- **Error**: Upload timeouts or failures
- **Solution**: Check Firebase Storage rules and CORS configuration
- **Fallback**: App automatically falls back to base64 encoding

### Database Connection Issues
- **Error**: MongoDB connection failed
- **Solution**: Ensure MongoDB is running and connection string is correct
- **Check**: Verify MONGODB_URI in server .env file

## 🚀 Deployment

### Client (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Server (Railway/Heroku)
1. Set up MongoDB Atlas for production database
2. Configure environment variables
3. Deploy using platform-specific instructions

## 📚 Key Features

### Authentication
- Google OAuth integration
- Role-based access control (Founder/Investor)
- Protected routes with AuthGuard

### Image Upload
- Firebase Storage integration
- Automatic image cropping (4:5 ratio)
- CORS fallback to base64
- Progress indicators

### Real-time Features
- Live notifications
- Chat messaging
- Follow/unfollow updates

### Performance Optimizations
- Error boundaries for crash prevention
- Loading states and skeleton screens
- Image optimization and lazy loading
- Firestore query optimization

## 🐛 Troubleshooting

### Development Issues
1. Clear browser cache and cookies
2. Check browser console for errors
3. Verify all environment variables are set
4. Ensure all services (Firebase, MongoDB) are running

### Production Issues
1. Check server logs for errors
2. Verify environment variables in production
3. Test Firebase rules and permissions
4. Monitor network requests for failures

## 📞 Support

If you encounter issues not covered in this guide:
1. Check the browser console for error messages
2. Review Firebase project settings
3. Verify all environment variables are correctly set
4. Ensure all dependencies are installed and up to date

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Configure proper Firestore security rules
- Enable Firebase App Check for production
- Use HTTPS in production environments

## 📈 Performance Tips

- Use React DevTools to identify performance bottlenecks
- Monitor Firebase usage and optimize queries
- Implement proper error boundaries
- Use lazy loading for images and components
- Cache frequently accessed data

---

For more detailed information, see:
- `FIREBASE_SETUP.md` - Firebase configuration
- `CORS_FIX_GUIDE.md` - CORS troubleshooting
- `FIREBASE_STORAGE_SETUP.md` - Storage configuration
- `MESSAGING_NOTIFICATIONS.md` - Notification setup
