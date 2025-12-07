# 🚀 Jertz Quick Start Guide

Welcome to **Jertz** - The Social Music Platform! This guide will get you up and running in minutes.

## ⚡ Super Quick Start (3 Steps)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Configure Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project called "Jertz"
3. Copy your config and paste into `src/config/firebase.js`

### 3️⃣ Run the App
```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

---

## 📱 What You Can Test Right Now

### Without Firebase Setup (Limited Mode)
✅ View the UI and design  
✅ Navigate between screens  
✅ Test Guest mode flow  
✅ See room layouts (Standard & Challenge)  
✅ View profile and explore screens  

❌ Cannot sign up/login  
❌ Cannot create rooms  
❌ Cannot upload files  

### With Firebase Setup (Full Mode)
✅ Everything above PLUS:  
✅ Create account & login  
✅ Create and join rooms  
✅ Upload music files  
✅ Real-time chat (needs additional setup)  
✅ Profile management  

---

## 🔥 Firebase Setup (5 Minutes)

### Step 1: Create Project
1. Visit [console.firebase.google.com](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: **Jertz**
4. Disable Google Analytics (or enable if you want)
5. Click "Create project"

### Step 2: Register Web App
1. Click the **Web** icon (`</>`)
2. App nickname: **Jertz Web**
3. Copy the `firebaseConfig` object
4. Open `src/config/firebase.js`
5. Replace the placeholder values with your config

Example:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",  // ← Paste your actual values here
  authDomain: "jertz-xxxxx.firebaseapp.com",
  projectId: "jertz-xxxxx",
  storageBucket: "jertz-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Step 3: Enable Services

#### Authentication
1. Go to **Build** → **Authentication**
2. Click "Get started"
3. Enable **Email/Password**
4. Click "Save"

#### Firestore Database
1. Go to **Build** → **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (we'll secure it later)
4. Choose a location
5. Click "Enable"

#### Storage
1. Go to **Build** → **Storage**
2. Click "Get started"
3. Start in **test mode**
4. Click "Done"

### Step 4: Test It!
```bash
npm start
```

Try signing up with an email and password. If it works, you're all set! 🎉

---

## 🎨 App Features Overview

### 🏠 Home Screen
- **Promoted Song**: Auto-plays for 7 seconds when you open the app
- **Top 10 Charts**: Popular tracks on the platform
- **Fresh Drops**: Newly uploaded music
- **Live Rooms**: Active listening sessions

### 🎵 Create Room
Two modes to choose from:

**Standard Mode** 🎧
- Focus on music and conversation
- Large album art display
- Real-time chat on the right
- Voice reactions

**Challenge Mode** 🎮
- Gaming experience with image voting
- Swipeable 500x500px image carousel
- Double-tap to vote
- Gold/Silver borders for top 2
- Mini player at bottom

### 📤 Upload
- Upload MP3/WAV files (max 50MB)
- Import YouTube playlists (coming soon)
- Copyright liability agreement

### 👤 Profile
- View stats (Uploads, Rooms, Followers)
- Edit profile
- Settings & privacy
- Sign out

### 🔍 Explore
- Search for rooms, tracks, and users
- Discover new content
- See what's trending

---

## 🎯 Test Scenarios

### Scenario 1: Guest Experience
1. Open app
2. Click "Continue as Guest"
3. Browse home feed
4. Try to create a room → Should prompt to sign up ✅

### Scenario 2: New User Signup
1. Click "Get Started"
2. Enter name, email, password
3. Create account
4. Should redirect to home feed ✅

### Scenario 3: Create a Room
1. Sign in
2. Click "Create a Room"
3. Enter room name
4. Choose mode (Standard or Challenge)
5. Set capacity
6. Create room ✅

### Scenario 4: Upload Music
1. Sign in
2. Go to Upload tab
3. Click "Upload Audio File"
4. Select MP3/WAV file
5. Accept liability waiver
6. Upload ✅

---

## 🎨 Brand Colors Reference

Based on your Jertz logo:

- **Primary Red**: `#E21F26` - Main brand color
- **Secondary Purple**: `#7B2D8E` - Accent color
- **Gradient**: Red → Purple (used throughout)

---

## 🐛 Common Issues

### Issue: "Cannot find module 'expo'"
**Fix**: Run `npm install` again

### Issue: Firebase errors
**Fix**: Make sure you replaced ALL values in `firebase.js`

### Issue: App won't start
**Fix**: 
```bash
npm start -- --reset-cache
```

### Issue: Metro bundler errors
**Fix**: 
```bash
watchman watch-del-all
rm -rf node_modules
npm install
npm start
```

---

## 📚 What's Next?

1. **Customize**: Edit colors in `src/config/theme.js`
2. **Add Features**: Check `ROADMAP.md` for ideas
3. **Deploy**: See `SETUP.md` for production deployment
4. **Connect Real-Time**: Implement Firestore listeners for chat

---

## 🆘 Need Help?

- 📖 **Full Setup Guide**: See `SETUP.md`
- 🗺️ **Feature Roadmap**: See `ROADMAP.md`
- 📝 **Code Documentation**: Check inline comments
- 🐛 **Report Issues**: Contact support@jertz.app

---

## 🎉 You're Ready!

Your Jertz app is now set up and ready for development. Start by testing the core features, then customize and expand based on your needs.

**Happy coding! 🎵**

---

**Created by**: Jeremy Topaka  
**Platform**: React Native + Firebase  
**Target**: Gen Z Social Music Experience
