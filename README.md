# Jertz - The Social Music Platform

<div align="center">
  <img src="./logo.png" alt="Jertz Logo" width="200"/>
  
  **The Digital Hangout for Gen Z**
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-~50.0-black.svg)](https://expo.dev/)
  [![Firebase](https://img.shields.io/badge/Firebase-10.7-orange.svg)](https://firebase.google.com/)
</div>

## 🎵 About Jertz

Jertz is not just a streaming service; it's a digital hangout. We digitize the feeling of sitting in a room with friends, passing the aux cord, and laughing over old photos. While traditional platforms focus on solitary listening, **Jertz focuses on synchronicity**.

### ✨ Key Features

- **🎧 Live Listening Rooms** - Listen to music together in real-time with friends
- **🎮 Challenge Mode** - Interactive image voting challenges with live music
- **📱 Dual-Source Music** - Upload your own tracks OR import YouTube playlists
- **💬 Real-Time Chat** - Engage with friends while listening
- **🔊 Voice Reactions** - Send instant audio reactions that play for everyone
- **🎁 Gift Box Animations** - Share photos with fun reveal animations
- **👑 Host Controls** - DJ powers with the ability to pass the mic

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   cd /Users/tpk/Documents/Jerttech/Jertz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   
   Then update `/src/config/firebase.js` with your credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Enable Firebase Services**
   
   In your Firebase Console, enable:
   - ✅ Authentication (Email/Password & Google Sign-In)
   - ✅ Firestore Database
   - ✅ Cloud Storage
   - ✅ Realtime Database (for live chat)

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on your device**
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## 📁 Project Structure

```
Jertz/
├── App.js                      # Main app entry point
├── src/
│   ├── config/
│   │   ├── firebase.js         # Firebase configuration
│   │   ├── theme.js            # App theme & colors (Jertz brand)
│   │   └── constants.js        # App constants
│   ├── contexts/
│   │   ├── AuthContext.js      # Authentication state management
│   │   └── MusicContext.js     # Music player state management
│   ├── navigation/
│   │   └── Navigation.js       # App navigation setup
│   ├── screens/
│   │   ├── auth/               # Authentication screens
│   │   │   ├── WelcomeScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   └── SignUpScreen.js
│   │   ├── home/
│   │   │   └── HomeScreen.js   # Main feed with charts & rooms
│   │   ├── explore/
│   │   │   └── ExploreScreen.js # Discover rooms, tracks, users
│   │   ├── upload/
│   │   │   └── UploadScreen.js  # Upload & YouTube integration
│   │   ├── profile/
│   │   │   └── ProfileScreen.js # User profile & settings
│   │   └── room/
│   │       ├── CreateRoomScreen.js      # Create new room
│   │       ├── ListeningRoomScreen.js   # Standard listening mode
│   │       └── ChallengeRoomScreen.js   # Challenge/gaming mode
│   └── components/             # Reusable components (add as needed)
├── assets/                     # Images, sounds, fonts
└── package.json
```

## 🎨 Brand Colors

Jertz uses a vibrant red-to-purple gradient inspired by the logo:

- **Primary Red**: `#E21F26`
- **Secondary Purple**: `#7B2D8E`
- **Accent**: `#D91F68`

## 🔥 Core Features Implementation

### 1. Listening Rooms (Standard Mode)
- **Left/Center**: Large album art display and music controls
- **Right Panel**: Fixed chat stream
- **Features**: Voice reactions, host controls, real-time sync

### 2. Challenge Rooms (Gaming Mode)
- **Top/Center**: Swipeable image carousel (500x500px)
- **Bottom**: Mini music player
- **Right Panel**: Chat stream
- **Features**: Double-tap voting, real-time leaderboards, gold/silver borders

### 3. Dual-Source Music Engine
- **Upload**: MP3/WAV files with liability waiver
- **YouTube**: OAuth integration for playlist import

### 4. Guest Mode
- Browse Top 10 Charts and Fresh Drops
- Must sign up to join rooms, upload, or vote

## 🛠️ Technologies Used

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation 6
- **Backend**: Firebase (Auth, Firestore, Storage, Realtime DB)
- **Audio**: Expo AV
- **UI**: Expo Linear Gradient, React Native Gesture Handler

## 📱 User Flow

1. **Welcome Screen** → Guest mode or Sign Up/Login
2. **Home Feed** → Browse charts, rooms, and featured tracks
3. **Create Room** → Choose mode (Standard/Challenge) and settings
4. **Live Room** → Listen together, chat, react, and vote
5. **Upload** → Share your music with copyright agreement

## 🎯 Target Audience

Gen Z (13+) - Music lovers who want to connect and share audio experiences

## 📄 License

Copyright © 2025 Jerttech. All rights reserved.

## 👨‍💻 Creator

**Jeremy Topaka** - Founder & Creator of Jertz

---

<div align="center">
  <strong>🎵 Jertz: Where Music Brings People Together 🎵</strong>
</div>
