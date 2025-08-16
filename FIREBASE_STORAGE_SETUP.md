# Firebase Storage Setup Guide

## 🔧 **Firebase Storage Rules Configuration**

The image upload feature requires proper Firebase Storage rules. Follow these steps to configure them:

### **Step 1: Access Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `foundic-77bc6`
3. In the left sidebar, click on **"Storage"**

### **Step 2: Initialize Storage (if not done)**
1. If you see "Get started" button, click it
2. Choose a location (select the closest to your users)
3. Start in test mode (we'll update rules later)

### **Step 3: Update Storage Rules**
1. In the Storage section, click on **"Rules"** tab
2. Replace the existing rules with the following:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload images to post-images folder
    match /post-images/{fileName} {
      allow read: if true;  // Anyone can view images
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024  // 5MB limit
                   && request.resource.contentType.matches('image/.*');  // Only images
    }
    
    // Allow authenticated users to upload profile images
    match /profile-images/{fileName} {
      allow read: if true;
      allow write: if request.auth != null 
                   && request.resource.size < 2 * 1024 * 1024  // 2MB limit
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Default rule - deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### **Step 4: Publish Rules**
1. Click **"Publish"** to save the rules
2. Wait for the rules to be deployed (usually takes a few seconds)

### **Step 5: Test the Upload**
1. Go back to your Foundic app
2. Try uploading an image again
3. Check the browser console for any error messages

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **1. "Storage access denied" error**
- **Solution**: Make sure you've published the storage rules
- **Check**: Verify rules allow authenticated users to write to `post-images/`

#### **2. "Quota exceeded" error**
- **Solution**: Check your Firebase Storage usage in the console
- **Fix**: Upgrade plan or optimize image sizes

#### **3. "Network error" or timeout**
- **Solution**: Check your internet connection
- **Fix**: Try uploading a smaller image first

#### **4. "File too large" error**
- **Solution**: The 5MB limit is enforced by the rules
- **Fix**: Compress the image or use a smaller file

### **Debugging Steps:**
1. **Open Browser Console** (F12)
2. **Try uploading an image**
3. **Look for error messages** in the console
4. **Check Network tab** for failed requests

### **Alternative Rules (More Permissive for Testing):**
If you want to test quickly, you can use these rules (NOT recommended for production):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## ✅ **Verification**

After setting up the rules:
1. ✅ Users can upload images up to 5MB
2. ✅ Only authenticated users can upload
3. ✅ Images are stored in `post-images/` folder
4. ✅ Anyone can view uploaded images
5. ✅ Only image files are allowed

## 🚨 **Security Notes**

- The rules above allow any authenticated user to upload images
- For production, consider adding user-specific folders
- Monitor storage usage to avoid quota issues
- Consider implementing image compression

## 📞 **Need Help?**

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify Firebase project settings
3. Ensure you're using the correct Firebase config
4. Check if Storage is enabled in your Firebase project
