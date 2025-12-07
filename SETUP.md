# Jertz Development Guide

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## 🔧 Firebase Setup (Required)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "Jertz" (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Register Your App

1. In Firebase Console, click the **Web** icon (`</>`)
2. Register app as "Jertz Web"
3. Copy the `firebaseConfig` object
4. Paste it into `/src/config/firebase.js` (replace the placeholder values)

### Step 3: Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (for YouTube integration later)

### Step 4: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Start in **production mode**
3. Choose a location close to your users

### Step 5: Set Up Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Rooms collection
    match /rooms/{roomId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.hostId == request.auth.uid;
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if true;
        allow create: if request.auth != null;
      }
    }
    
    // Tracks collection
    match /tracks/{trackId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.uploadedBy == request.auth.uid;
    }
  }
}
```

### Step 6: Set Up Storage

1. Go to **Storage** → **Get started**
2. Start in **production mode**
3. Set up Storage Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tracks/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /images/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📊 Firestore Collections Structure

### `users`
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,
  createdAt: timestamp,
  uploadedTracks: array,
  rooms: array
}
```

### `rooms`
```javascript
{
  id: string,
  name: string,
  hostId: string,
  hostName: string,
  mode: 'STANDARD' | 'CHALLENGE',
  capacity: number,
  currentParticipants: number,
  isPrivate: boolean,
  currentTrack: {
    id: string,
    title: string,
    artist: string,
    source: 'UPLOAD' | 'YOUTUBE',
    uri: string
  },
  createdAt: timestamp,
  isActive: boolean
}
```

### `tracks`
```javascript
{
  id: string,
  title: string,
  artist: string,
  uploadedBy: string,
  uploaderName: string,
  source: 'UPLOAD' | 'YOUTUBE',
  uri: string,
  duration: number,
  plays: number,
  uploadedAt: timestamp
}
```

## 🎨 Customizing the Theme

Edit `/src/config/theme.js` to customize colors:

```javascript
export const COLORS = {
  primary: '#E21F26',      // Your main brand color
  secondary: '#7B2D8E',    // Your secondary brand color
  // ... modify as needed
};
```

## 🔊 Adding Voice Reaction Sounds

1. Create `/assets/sounds/` directory
2. Add MP3 files:
   - `fire.mp3`
   - `next.mp3`
   - `boo.mp3`
   - `love.mp3`
   - `wow.mp3`
   - `laugh.mp3`

## 📸 Adding App Icons & Splash Screen

Replace these placeholder files:
- `/assets/icon.png` (1024x1024)
- `/assets/splash.png` (1242x2436 for iOS)
- `/assets/adaptive-icon.png` (1024x1024 for Android)
- `/assets/favicon.png` (48x48 for web)

## 🎥 YouTube Integration (Advanced)

To enable YouTube playlist import:

1. **Enable YouTube Data API v3**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable YouTube Data API v3
   - Create OAuth 2.0 credentials
   
2. **Configure OAuth**
   - Add credentials to your app
   - Handle OAuth flow in UploadScreen

3. **Install YouTube Player**
   ```bash
   npm install react-native-youtube-iframe
   ```

## 🐛 Common Issues & Solutions

### Issue: Firebase not connecting
**Solution**: Check that you've replaced the placeholder values in `firebase.js`

### Issue: "Expo module not found"
**Solution**: Run `npx expo install` to fix dependencies

### Issue: Audio not playing
**Solution**: Check permissions in `app.json` and test on physical device

### Issue: Styles not applying
**Solution**: Restart the Metro bundler with `npm start --reset-cache`

## 📱 Testing

### Guest Mode Testing
1. Open app → "Continue as Guest"
2. Browse home feed
3. Try to join room → should prompt signup

### Authentication Testing
1. Sign up with email/password
2. Log out
3. Log back in
4. Test password validation

### Room Testing
1. Create a room
2. Test music controls
3. Send chat messages
4. Try voice reactions

## 🚀 Building for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

### Web
```bash
npm run web
```

## 📦 Deployment Checklist

- [ ] Replace Firebase placeholder config
- [ ] Add app icons and splash screens
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Set up Firestore security rules
- [ ] Set up Storage security rules
- [ ] Add voice reaction sound files
- [ ] Configure YouTube API (optional)
- [ ] Test guest mode flow
- [ ] Test authenticated user flow
- [ ] Test room creation and joining
- [ ] Update app version in `app.json`

## 🎯 Next Steps

1. **Add Real-Time Sync**: Implement Firestore real-time listeners for chat and music sync
2. **Upload Logic**: Complete file upload to Firebase Storage
3. **YouTube Integration**: Add OAuth and playlist import
4. **Push Notifications**: Set up for room invites
5. **Analytics**: Add Firebase Analytics for tracking
6. **Payment Integration**: Add for premium features (optional)

## 📞 Support

For issues or questions:
- Email: support@jertz.app
- Twitter: @JertzApp

---

**Happy Coding! 🎵**
