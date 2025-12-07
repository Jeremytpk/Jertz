# Jertz App - Quick Setup Script
# Run this after cloning the repository

echo "🎵 Setting up Jertz - The Social Music Platform 🎵"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node -v)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm found: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "⚠️  IMPORTANT: Before running the app, you need to:"
echo "   1. Create a Firebase project at https://console.firebase.google.com"
echo "   2. Copy your Firebase config to src/config/firebase.js"
echo "   3. Enable Authentication, Firestore, and Storage in Firebase Console"
echo ""
echo "📚 For detailed setup instructions, see SETUP.md"
echo ""
echo "🚀 To start the app, run: npm start"
echo ""
