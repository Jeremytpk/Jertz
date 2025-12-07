# Assets Directory

This directory contains all media assets for the Jertz app.

## 📁 Directory Structure

```
assets/
├── sounds/          # Voice reaction sound files
├── images/          # App images and graphics
├── icon.png         # App icon (1024x1024)
├── splash.png       # Splash screen (1242x2436)
├── adaptive-icon.png # Android adaptive icon (1024x1024)
└── favicon.png      # Web favicon (48x48)
```

## 🔊 Required Sound Files

Add these MP3 files to the `sounds/` directory for voice reactions:

- `fire.mp3` - Fire reaction sound
- `next.mp3` - Next track sound
- `boo.mp3` - Disapproval sound
- `love.mp3` - Love reaction sound
- `wow.mp3` - Wow reaction sound
- `laugh.mp3` - Laugh reaction sound

**Format**: MP3, 16-44kHz, Mono recommended  
**Duration**: 1-2 seconds max  
**Size**: < 100KB per file

## 🎨 Required Image Files

### App Icons

1. **icon.png** (1024x1024)
   - Main app icon
   - Used for iOS App Store
   - PNG with transparency

2. **splash.png** (1242x2436 for iPhone X)
   - Splash screen shown at launch
   - Should feature Jertz branding
   - Portrait orientation

3. **adaptive-icon.png** (1024x1024)
   - Android adaptive icon
   - Safe zone: center 66% (684x684)
   - Outer 33% may be masked

4. **favicon.png** (48x48)
   - Web browser icon
   - Simple, recognizable at small size

## 📝 Image Guidelines

- Use PNG format for transparency
- Follow Jertz brand colors:
  - Red: #E21F26
  - Purple: #7B2D8E
- Optimize files for mobile (compress images)
- Test on both iOS and Android

## 🎵 Where to Find Free Sounds

- [Freesound.org](https://freesound.org/)
- [Zapsplat.com](https://www.zapsplat.com/)
- [Soundbible.com](http://soundbible.com/)

Remember to check licensing for commercial use!

## 🎨 Where to Create Icons

- [Figma](https://figma.com/) - Free design tool
- [Canva](https://canva.com/) - Easy icon creator
- [Adobe Express](https://www.adobe.com/express/) - Quick designs

---

**Note**: The app will work without these assets, but they enhance the user experience significantly!
