# 🎵 Jertz - Complete Features List

## 📱 App Overview

**Jertz** is a social music platform designed for Gen Z that combines synchronized music listening with interactive gaming elements. It's where TikTok's engagement meets Clubhouse's real-time experience, but focused entirely on music.

---

## 🎯 Core Value Propositions

1. **Synchronous Listening**: Everyone hears the exact same moment together
2. **Dual Music Sources**: Upload your own tracks OR import from YouTube
3. **Two Distinct Modes**: Chill vibing or competitive gaming
4. **High-Energy Interactions**: Voice reactions, gift boxes, live voting
5. **Zero Friction Entry**: Guest mode lets you explore before signing up

---

## 🔐 Authentication & Onboarding

### Welcome Experience
- **Splash Screen**: Auto-playing promoted song (5-10 seconds)
- **Three Entry Points**:
  - Continue as Guest (limited features)
  - Sign Up (full access)
  - Login (existing users)

### Guest Mode Features
- ✅ Browse Home Feed (Top 10 Charts, Fresh Drops)
- ✅ View active Live Rooms
- ✅ Listen to promoted tracks
- ❌ Cannot join rooms
- ❌ Cannot upload tracks
- ❌ Cannot create rooms
- ❌ Cannot vote in challenges

### Account Creation
- Email/Password authentication
- Display name customization
- Profile photo (optional)
- Instant access to all features

---

## 🏠 Home Screen

### Promoted Song Feature
- **Auto-Play**: Song fades in when app opens
- **Duration**: 5-10 seconds
- **Skip Option**: X button to dismiss
- **Purpose**: Artist promotion and immediate immersion

### Content Sections

#### 🔥 Top 10 Charts
- Ranked by play count
- Horizontal scroll cards
- Shows: Rank badge, album art, title, artist, play count
- Tap to preview or create room

#### ✨ Fresh Drops
- Recently uploaded tracks
- Sorted by upload date
- Horizontal scroll cards
- Same card design as Top 10

#### 🎧 Live Rooms
- Currently active rooms
- Vertical list
- Shows: Room name, host, participant count, capacity, LIVE badge
- Tap to join (requires account)

### Quick Actions
- **Create Room Button**: Large CTA at top
- **Search**: Global search icon
- **Notifications**: Bell icon with badge

---

## 🔍 Explore Screen

### Search Bar
- Global search across rooms, tracks, and users
- Real-time results
- Search history

### Three Tabs

#### Rooms Tab
- **Live Now**: Currently active rooms
- **Recently Ended**: Past rooms
- Filter by mode (Standard/Challenge)
- Sort by popularity, recency, capacity

#### Tracks Tab
- **Popular Tracks**: Most played
- **New Releases**: Recently uploaded
- **Trending**: Most played in last 24h
- Play preview inline

#### Users Tab
- **Suggested Users**: Algorithmic recommendations
- **Top Creators**: Most active users
- **Follow Button**: Quick follow
- Shows: Avatar, username, bio, stats

---

## ⬆️ Upload Screen

### Upload from Device
- **Supported Formats**: MP3, WAV
- **Max File Size**: 50MB
- **File Picker**: Native file browser
- **Metadata Entry**:
  - Track title (required)
  - Artist name (required)
  - Album name (optional)
  - Genre (optional)
  - Cover art (optional)

### Liability Waiver
- **Trigger**: Shown after file selection
- **Content**: Full legal text
- **Required**: Must accept to proceed
- **Storage**: Waiver acceptance logged in database
- **Purpose**: Copyright protection

### YouTube Import
- **Google OAuth**: Sign in with Google
- **Playlist Access**: Read-only permissions
- **Import Options**:
  - Import entire playlist
  - Select specific tracks
- **Metadata**: Auto-populated from YouTube
- **Video Display**: Video becomes "album art"

### Upload Progress
- Progress bar
- Upload speed
- Cancel option
- Success/Error notifications

### Your Uploads Library
- List of uploaded tracks
- Edit metadata
- Delete tracks
- Share to room
- View play count

---

## 👤 Profile Screen

### For Guests
- Large "Create Account" CTA
- Limited preview of features
- "Already have account?" link

### For Logged-In Users

#### Profile Header
- Large avatar (120x120)
- Display name
- Email
- Edit profile button

#### Stats Row
- **Uploads**: Total tracks uploaded
- **Rooms**: Rooms created/hosted
- **Followers**: Follower count

#### Menu Options
- 🎵 My Uploads
- ⏱️ Listening History
- ❤️ Favorites
- 👥 Following
- 🔔 Notifications Settings
- 🔒 Privacy & Security
- ❓ Help & Support
- ℹ️ About Jertz

#### Sign Out
- Confirmation dialog
- Clears session
- Returns to welcome screen

---

## 🎨 Create Room Screen

### Room Setup

#### Room Name
- Text input
- Character limit: 50
- Emoji support
- Examples shown

#### Room Mode Selection
Two large cards to choose from:

**Standard Mode (Vibing)**
- 🎵 Musical notes icon
- "Focus on music & conversation"
- Large album art
- Full music controls
- Active chat

**Challenge Mode (Gaming)**
- 🎮 Game controller icon
- "Gaming & image voting"
- Image carousel
- Voting system
- Mini player

#### Capacity Slider
- Range: 2-50 participants
- +/- buttons
- Visual display with people icon
- Default: 25

#### Privacy Toggle
**Public Room**
- 🌍 Globe icon
- Appears in Explore
- Anyone can join
- Shareable link

**Private Room**
- 🔒 Lock icon
- Only via link
- Invite-only
- Hidden from Explore

### Create Button
- Validates input
- Creates room in database
- Navigates to appropriate room screen
- Generates shareable deep link

---

## 🎧 Listening Room (Standard Mode)

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ Header: Room Name | Live Indicator | Menu       │
├────────────────────────┬────────────────────────┤
│                        │                        │
│   Music Section        │   Chat Panel           │
│   (Left/Center)        │   (Right - Fixed)      │
│                        │                        │
│  - Album Art (Large)   │  - Messages            │
│  - Track Info          │  - User avatars        │
│  - Music Controls      │  - Timestamps          │
│  - Voice Reactions     │  - Message input       │
│  - Host Controls       │                        │
│                        │                        │
└────────────────────────┴────────────────────────┘
```

### Music Section Features

#### Album Art Display
- Large square image (50% of screen width)
- Rounded corners
- Drop shadow
- Animated pulsing when playing
- Gradient overlay at bottom

#### Track Information
- **Track Title**: Large, bold, centered
- **Artist Name**: Medium, secondary color
- **Album Name**: Small, muted
- All centered below album art

#### Music Controls
- **Skip Back**: Previous track
- **Play/Pause**: Large circular gradient button
- **Skip Forward**: Next track
- Synchronized for all users
- Only host can control (unless mic passed)

#### Progress Bar
- Shows current position
- Total duration
- Seekable (host only)
- Synced across all users

#### Voice Reactions Bar
- Horizontal scrollable strip
- 6 reactions: 🔥 Fire, ⏭️ Next, 👎 Boo, ❤️ Love, 😮 Wow, 😂 LOL
- Tap to trigger
- Plays audio clip over music for ALL users
- Brief volume duck on music
- Visual animation in room

#### Host Controls
- **"Pass the Mic" Button**
  - Shows user list
  - Select user to transfer DJ controls
  - Instant transfer
  - Previous host becomes guest

### Chat Panel Features

#### Chat Header
- 💬 Chat icon
- "Chat" label
- Online count

#### Message List
- Auto-scroll to bottom
- User avatar (small)
- Username (colored)
- Message text
- Timestamp
- Image support (Gift Box animation)

#### Message Input
- Text input field
- Send button
- Image attach button
- Emoji picker
- Character limit: 500

#### Gift Box Animation
When user sends image:
1. Gift box icon appears
2. Animates bouncing
3. "Pops" open
4. Image reveals with confetti
5. Stays in chat

---

## 🎮 Challenge Room (Gaming Mode)

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ Header: Challenge Name | Live Indicator | Menu  │
├────────────────────────┬────────────────────────┤
│                        │                        │
│   Challenge Canvas     │   Chat Panel           │
│   (Top/Center)         │   (Right - Fixed)      │
│                        │                        │
│  - Image Carousel      │  - Messages            │
│  - Voting Area         │  - Vote discussions    │
│  - Leaderboard         │  - Reactions           │
│  - Mini Player         │  - Message input       │
│   (Bottom Bar)         │                        │
│                        │                        │
└────────────────────────┴────────────────────────┘
```

### Challenge Canvas Features

#### Image Carousel
- **Swipeable**: Horizontal drag to navigate
- **Size**: 500x500px images
- **Pagination Dots**: Show position
- **User Badge**: Username overlay
- **Vote Count**: Heart icon + number

#### Voting System
- **Double-Tap to Vote**: Instagram-style
- **Heart Animation**: Burst effect
- **Vote Limit**: 1 vote per image per user
- **Real-Time Count**: Updates instantly
- **Sound Effect**: Brief chime

#### Ranking Borders
- **#1 (Gold)**: Thick gold border (4px)
- **#2 (Silver)**: Thick silver border (4px)
- **Others**: No special border

#### Leaderboard Display
- **Top 3 Section**: Always visible
- Shows:
  - Rank number
  - Thumbnail image
  - Username
  - Vote count
- Updates in real-time
- Animated position changes

### Mini Music Player

Located at bottom of challenge canvas:

```
┌────────────────────────────────────────────────┐
│ [Album Art] Track Name - Artist    [Play/Pause]│
└────────────────────────────────────────────────┘
```

- **Compact Design**: Single row
- **Small Album Art**: 50x50px
- **Track Info**: Title and artist
- **Play/Pause Only**: Minimal controls
- **Tap to Expand**: Opens full player modal

---

## 🗣️ Voice Reactions System

### Available Reactions

1. **🔥 Fire!** - Hype/Excitement
2. **⏭️ Next!** - Skip request
3. **👎 Boooo!** - Disapproval
4. **❤️ Love it!** - Approval
5. **😮 Wow!** - Surprise
6. **😂 LOL** - Laughter

### How It Works

1. User taps reaction button
2. Sound file loads
3. Music volume ducks to 30%
4. Reaction plays at 100%
5. Visual animation shows (emoji burst)
6. Music volume returns to 100%
7. All users hear it simultaneously

### Technical Details
- **Sound Format**: MP3, ~2-3 seconds each
- **Volume Mixing**: Native audio API
- **Network**: Broadcast to all room participants
- **Rate Limit**: Max 1 reaction per 5 seconds per user
- **Storage**: Sounds pre-loaded in app bundle

---

## 🎼 Music Player Technical Specs

### Synchronization
- **Sync Method**: Firebase Realtime Database
- **Fields Synced**:
  - Current track ID
  - Play state (playing/paused)
  - Current position (milliseconds)
  - Last update timestamp
- **Latency Target**: <100ms
- **Catch-up Logic**: Auto-adjusts if drift >1 second

### Audio Sources

#### User Uploads
- **Storage**: Firebase Storage
- **Streaming**: HTTP streaming URLs
- **Caching**: Local cache for repeated plays
- **Bitrate**: 128-320 kbps

#### YouTube Tracks
- **API**: YouTube iframe Player API
- **Video Display**: Shown as large "album art"
- **Audio Only Mode**: Option to show video or static image
- **Caching**: Not available (YouTube ToS)

---

## 💬 Chat System

### Message Types

#### Text Messages
- Plain text
- Emoji support
- Link detection
- @mentions

#### Image Messages
- PNG, JPG support
- Max size: 5MB
- Compressed before upload
- Gift Box reveal animation

#### System Messages
- User joined
- User left
- Host changed
- Track changed
- Challenge winner

### Real-Time Updates
- **Technology**: Firestore real-time listeners
- **Pagination**: Load 50 messages at a time
- **Scroll Behavior**: Auto-scroll on new message
- **Offline Support**: Queue messages, send when online

---

## 🎯 Discovery & Algorithms

### Top 10 Charts
- **Metric**: Total plays in last 7 days
- **Update**: Every hour
- **Tie-breaker**: Recent plays weighted higher

### Fresh Drops
- **Criteria**: Uploaded in last 24 hours
- **Sort**: Upload timestamp (newest first)
- **Minimum**: No play count requirement

### Live Rooms
- **Sort**: Participant count (desc)
- **Filter**: Active in last 5 minutes
- **Hide**: Private rooms

### Trending Algorithm
```
Score = (plays × 0.5) + (rooms_created × 2) + (votes × 1.5)
Time_Decay = exp(-hours_since_upload / 24)
Final_Score = Score × Time_Decay
```

---

## 🔒 Security & Privacy

### Copyright Protection
- Digital waiver required for uploads
- User assumes all liability
- DMCA takedown process
- Content ID (future integration)

### User Privacy
- Email not shown publicly
- Block/unblock users
- Report inappropriate content
- Hide online status (optional)

### Content Moderation
- AI-powered image scanning
- Keyword filtering
- User reporting system
- Admin review dashboard

---

## 📊 Analytics & Metrics

### Track Metrics
- Total plays
- Unique listeners
- Rooms using track
- Average completion rate
- Skip rate

### Room Metrics
- Total participants (all-time)
- Peak concurrent users
- Average session duration
- Message count
- Reactions triggered

### User Metrics
- Total listening time
- Rooms hosted
- Rooms joined
- Tracks uploaded
- Votes cast (challenges)

---

## 🚀 Performance Targets

- **App Launch**: <2 seconds
- **Screen Transitions**: <300ms
- **Music Sync Latency**: <100ms
- **Message Delivery**: <500ms
- **Image Load**: <1 second
- **Search Results**: <500ms

---

## 📱 Platform Requirements

### iOS
- iOS 13.0+
- iPhone 6S and newer
- 100MB storage minimum

### Android
- Android 5.0 (Lollipop) and up
- 2GB RAM minimum
- 100MB storage minimum

---

## 🌐 Network Requirements

- **Minimum**: 3G connection (384 Kbps)
- **Recommended**: 4G/WiFi
- **Data Usage**:
  - Audio streaming: ~1MB per minute
  - Chat: Negligible
  - Images: ~500KB each

---

*This document serves as the complete feature specification for Jertz v1.0*
