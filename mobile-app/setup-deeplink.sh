#!/bin/bash

echo "🚀 TalentLeague Deep Link Setup Script"
echo "========================================"
echo ""

# Check if we're in the mobile-app directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mobile-app directory"
    exit 1
fi

echo "📦 Step 1: Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/app @capacitor/android @capacitor/cli

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

echo "🔨 Step 2: Building React app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build React app"
    exit 1
fi
echo "✅ React app built"
echo ""

echo "🔄 Step 3: Syncing Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Failed to sync Capacitor"
    exit 1
fi
echo "✅ Capacitor synced"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Build the Android app:"
echo "   cd android && ./gradlew assembleDebug"
echo ""
echo "2. Install on your device (USB debugging enabled):"
echo "   cd android && ./gradlew installDebug"
echo ""
echo "3. Test the deep link using ADB:"
echo "   adb shell am start -W -a android.intent.action.VIEW -d \"talentleague://test/abc123\" com.talentleague.app"
echo ""
echo "4. Or send a test email and click the link"
echo ""
echo "📖 Read DEEP_LINKING_SETUP.md for detailed instructions"
