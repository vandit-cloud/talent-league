# Deep Linking Setup Guide

## Problem Fixed
The email links were not opening the mobile app because:
1. Missing Capacitor dependencies
2. AndroidManifest didn't handle URL path patterns properly
3. App wasn't using Capacitor's App API for deep links

## What Was Changed

### 1. Added Capacitor Dependencies
```bash
npm install @capacitor/core @capacitor/app @capacitor/android @capacitor/cli
```

### 2. Created capacitor.config.ts
Configuration file that tells Capacitor how to handle the app.

### 3. Fixed AndroidManifest.xml
Added proper intent filters with `android:pathPrefix="/"` to handle URLs like:
- `talentleague://test/TOKEN_HERE`

### 4. Updated App.tsx
Now uses Capacitor's App API to properly listen for deep links:
- `CapacitorApp.getLaunchUrl()` - handles app opening from link
- `CapacitorApp.addListener('appUrlOpen', ...)` - handles links when app is already running

### 5. Improved Backend Email
Now sends 3 types of links:
- Simple deep link: `talentleague://test/TOKEN`
- Android Intent URL: `intent://...` (with browser fallback)
- Web link: `http://your-backend.com/mcq-test/TOKEN`

## Setup Instructions

### Step 1: Install Dependencies
```bash
cd mobile-app
npm install
```

### Step 2: Build the React App
```bash
npm run build
```

### Step 3: Sync Capacitor
This copies the web build to Android and updates native configs:
```bash
npx cap sync android
```

### Step 4: Build the Android App
```bash
cd android
./gradlew assembleDebug
# or use Android Studio:
npx cap open android
```

### Step 5: Install on Device
```bash
# Connect your Android device via USB (with USB debugging enabled)
cd android
./gradlew installDebug

# Or install the APK manually:
# The APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

## Testing Deep Links

### Method 1: ADB Command (Easiest)
With app installed on device:
```bash
# Replace TOKEN_HERE with an actual test token
adb shell am start -W -a android.intent.action.VIEW -d "talentleague://test/TOKEN_HERE" com.talentleague.app
```

### Method 2: Test Email
1. Send a test email from your backend
2. Open email on your phone
3. Click the "📱 Open in TalentLeague App" button
4. App should open automatically

### Method 3: HTML Test File
Create a test HTML file and open it on your phone:
```html
<!DOCTYPE html>
<html>
<body>
    <h1>Test Deep Link</h1>
    <a href="talentleague://test/abc123def456">Open App</a>
</body>
</html>
```

## Troubleshooting

### App doesn't open from link
1. **Check app is installed**: Verify the app is installed on your device
2. **Check package name**: Open `android/app/build.gradle` and verify `applicationId "com.talentleague.app"`
3. **Rebuild and reinstall**:
   ```bash
   npx cap sync android
   cd android && ./gradlew installDebug
   ```
4. **Check logs**:
   ```bash
   adb logcat | grep -i "talentleague"
   ```

### Link opens browser instead of app
1. **Clear default app associations**:
   - Go to Settings > Apps > TalentLeague > Open by default
   - Tap "Clear defaults"
2. **Try again**: Click the link again

### App opens but doesn't navigate to test
1. **Check console logs**: Use Chrome DevTools for Android:
   - Chrome > `chrome://inspect`
   - Find your device and click "Inspect"
2. **Verify token format**: Ensure the URL format is correct

## Development Workflow

### When making changes to React code:
```bash
# In mobile-app directory
npm run build
npx cap sync android
```

### When making changes to AndroidManifest.xml:
```bash
# Just rebuild in Android Studio or:
cd android && ./gradlew assembleDebug
```

### When adding new deep link paths:
1. Update `android/app/src/main/AndroidManifest.xml`
2. Update `src/App.tsx` to handle the new path
3. Rebuild and reinstall

## Deep Link URL Formats Supported
1. **Simple scheme**: `talentleague://test/TOKEN`
2. **Android Intent**: `intent://test/TOKEN#Intent;scheme=talentleague;package=com.talentleague.app;end`
3. **Web fallback**: `http://your-backend.com/mcq-test/TOKEN`

## Environment Variables
Update your `.env` files if needed:

**Backend (.env):**
```env
FRONTEND_URL=http://192.168.1.16:5173
```

**Mobile App (.env.local):**
```env
REACT_APP_BACKEND_URL=http://192.168.1.16:5173
```

## Production Deployment
### For production builds:
```bash
cd mobile-app/android
./gradlew assembleRelease
# or
./gradlew bundleRelease  # for Google Play
```

### Sign the APK:
You'll need to create a keystore and configure signing in `android/app/build.gradle`

## Additional Resources
- [Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [Android App Links](https://developer.android.com/training/app-links)
