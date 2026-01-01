# Salah App - Setup Guide

## Prerequisites

- Node.js >= 20
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Firebase account

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### 3. Firebase Configuration

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add Android and iOS apps to your project

#### Android Configuration

1. Download `google-services.json`
2. Place it in `android/app/`
3. Update `android/build.gradle`:
   ```gradle
   dependencies {
       classpath 'com.google.gms:google-services:4.4.0'
   }
   ```
4. Update `android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

#### iOS Configuration

1. Download `GoogleService-Info.plist`
2. Add it to `ios/salah/` in Xcode
3. Ensure it's added to the target

#### Google Sign-In Setup

1. In Firebase Console, enable Google Sign-In in Authentication
2. Get your Web Client ID from Firebase Console
3. Update `src/services/authService.ts`:
   ```typescript
   GoogleSignin.configure({
     webClientId: 'YOUR_WEB_CLIENT_ID_HERE',
   });
   ```

### 4. Permissions Configuration

#### Android (`android/app/src/main/AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

#### iOS (`ios/salah/Info.plist`)

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to calculate prayer times</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>We need your location to calculate prayer times</string>
```

### 5. Run the App

#### Android
```bash
npm run android
```

#### iOS
```bash
npm run ios
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Text.tsx
│   ├── ProgressBar.tsx
│   ├── LoadingSpinner.tsx
│   └── PrayerCard.tsx
├── features/            # Feature-based modules
│   ├── namaz/           # Prayer times feature
│   │   └── screens/
│   ├── quran/           # Quran reading feature
│   │   └── screens/
│   └── profile/         # Profile and settings
│       └── screens/
├── navigation/          # Navigation configuration
│   ├── AppNavigator.tsx
│   ├── NamazNavigator.tsx
│   └── QuranNavigator.tsx
├── services/            # API and business logic
│   ├── prayerService.ts
│   ├── quranService.ts
│   ├── hadithService.ts
│   ├── mosqueService.ts
│   └── authService.ts
├── store/               # Zustand state management
│   ├── useAuthStore.ts
│   ├── usePrayerStore.ts
│   ├── useQuranStore.ts
│   └── useSettingsStore.ts
├── theme/               # Theme system
│   ├── ThemeContext.tsx
│   ├── themes.ts
│   └── types.ts
├── types/               # TypeScript definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── permissions.ts
│   ├── notifications.ts
│   └── dateUtils.ts
└── i18n/                # Internationalization
    ├── index.ts
    └── locales/
        ├── tr.json
        └── en.json
```

## Key Features

### Theme System
- Two predefined themes (theme1, theme2)
- Switchable from Profile screen
- Persists selection in AsyncStorage
- Easy to extend with new themes

### Internationalization
- Turkish and English support
- Language switching from Profile
- All UI text is translatable
- Uses i18next

### State Management
- Zustand for global state
- Separate stores for:
  - Authentication
  - Prayer times and progress
  - Quran reading progress
  - App settings

### Navigation
- Bottom Tab Navigation (3 tabs)
- Stack Navigation for detail screens
- Fully typed with TypeScript

## Development Notes

### Adding a New Theme

1. Define theme in `src/theme/themes.ts`
2. Add to `themes` object
3. Update `ThemeName` type in `src/types/index.ts`
4. Theme will appear in Profile settings

### Adding a New Language

1. Create translation file in `src/i18n/locales/`
2. Add to `src/i18n/index.ts` resources
3. Update `Language` type in `src/types/index.ts`

### Mock Services

Current services use mock data. To integrate real APIs:

1. **Prayer Times**: Update `src/services/prayerService.ts` to call a real API (e.g., adhan.xyz)
2. **Quran**: Update `src/services/quranService.ts` to load from API or local JSON
3. **Hadith**: Update `src/services/hadithService.ts` to load from API or database
4. **Mosques**: Update `src/services/mosqueService.ts` to use Google Places API

## Troubleshooting

### Firebase Issues
- Ensure `google-services.json` and `GoogleService-Info.plist` are correctly placed
- Verify Web Client ID is correct
- Check Firebase project settings

### Permission Issues
- Android: Check `AndroidManifest.xml` permissions
- iOS: Check `Info.plist` usage descriptions
- Test on real device (some permissions don't work on emulator)

### Build Issues
- Clear cache: `npm start -- --reset-cache`
- Clean build: `cd android && ./gradlew clean && cd ..`
- Reinstall pods: `cd ios && pod install && cd ..`

## Next Steps

1. Replace mock services with real API calls
2. Implement Google Drive backup
3. Add audio playback for Quran
4. Implement nearby mosques with Google Places API
5. Add more Surahs and complete Quran data
6. Enhance notification system
7. Add analytics
8. Add error tracking (Sentry, etc.)

