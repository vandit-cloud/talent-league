@echo off
echo 🚀 TalentLeague Deep Link Setup Script
echo ========================================
echo.

REM Check if we're in the mobile-app directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the mobile-app directory
    exit /b 1
)

echo 📦 Step 1: Installing Capacitor dependencies...
call npm install @capacitor/core @capacitor/app @capacitor/android @capacitor/cli

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    exit /b 1
)
echo ✅ Dependencies installed
echo.

echo 🔨 Step 2: Building React app...
call npm run build

if errorlevel 1 (
    echo ❌ Failed to build React app
    exit /b 1
)
echo ✅ React app built
echo.

echo 🔄 Step 3: Syncing Capacitor...
call npx cap sync android

if errorlevel 1 (
    echo ❌ Failed to sync Capacitor
    exit /b 1
)
echo ✅ Capacitor synced
echo.

echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Open Android Studio:
echo    npx cap open android
echo.
echo 2. Build and run the app from Android Studio
echo.
echo 3. Or build from command line:
echo    cd android
echo    gradlew.bat assembleDebug
echo.
echo 4. Test the deep link using ADB:
echo    adb shell am start -W -a android.intent.action.VIEW -d "talentleague://test/abc123" com.talentleague.app
echo.
echo 5. Or send a test email and click the link
echo.
echo 📖 Read DEEP_LINKING_SETUP.md for detailed instructions
