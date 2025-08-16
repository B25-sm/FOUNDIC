# Firebase Setup Guide

## 🔧 **Firebase Connection Issues**

If you're seeing Firebase connection errors, follow these steps:

### **1. Check Firebase Project Setup**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `foundic-77bc6`
3. Make sure the project is active and not suspended

### **2. Enable Firestore Database**

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to your users)

### **3. Check Firestore Rules**

Go to **Firestore Database > Rules** and make sure you have these rules for testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // WARNING: Only for development!
    }
  }
}
```

**⚠️ Important:** These rules allow anyone to read/write. For production, you'll need proper security rules.

### **4. Enable Authentication**

1. Go to **Authentication > Sign-in method**
2. **Enable Google authentication** (this is the only auth method):
   - Click on **Google**
   - Toggle **Enable**
   - Add your **Project support email** (your email)
   - Click **Save**
3. **Disable Email/Password** (optional - for security):
   - Click on **Email/Password**
   - Toggle **Disable**
   - Click **Save**

### **5. Check Project Configuration**

Your current config in `src/firebase.ts`:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDrPVBvfussk6lWmqV6NwvkCA9dAU01Cb8",
  authDomain: "foundic-77bc6.firebaseapp.com",
  projectId: "foundic-77bc6",
  storageBucket: "foundic-77bc6.appspot.com",
  messagingSenderId: "89159289678",
  appId: "1:89159289678:web:28f49c184c6976d49aac1f",
  measurementId: "G-H8H6W1BGRY"
};
```

### **6. Common Issues & Solutions**

**Issue:** "Could not reach Cloud Firestore backend"
- **Solution:** Check internet connection and Firebase project status

**Issue:** "400 Bad Request" errors
- **Solution:** Make sure Firestore is enabled and rules are set to test mode

**Issue:** "Client is offline"
- **Solution:** Check network connection and try refreshing the page

**Issue:** Authentication errors
- **Solution:** Make sure Email/Password auth is enabled in Firebase Console

### **7. Test Connection**

After setup, the app will show a Firebase status indicator in the bottom-right corner:
- 🔄 Checking connection...
- ✅ Connected (no message shown)
- ⚠️ Error with details

### **8. Production Security**

Before going live, update Firestore rules to:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🚀 **Next Steps**

1. Follow the setup steps above
2. Restart your development server: `npm run dev`
3. Check the Firebase status indicator
4. Try creating a test post on the Wall page

If issues persist, check the browser console for specific error messages.
