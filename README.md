# Salah - React Native Prayer App

A production-ready React Native application for prayer times, Quran reading, and Islamic content.

## Features

- **Prayer Times**: Location-based daily prayer times with progress tracking
- **Quran Reading**: Browse and read Surahs with translation and tafsir
- **Profile Management**: Google Sign-In with Firebase integration
- **Multi-language**: Turkish and English support
- **Theme System**: Switchable themes with persistence
- **Notifications**: Prayer time reminders and notifications
- **Clean Architecture**: Feature-based folder structure with SOLID principles

## Tech Stack

- React Native CLI (0.83.1)
- TypeScript
- Zustand (State Management)
- React Navigation (Bottom Tabs + Stack)
- Firebase (Auth, Firestore, Cloud Messaging)
- i18next (Internationalization)
- Axios (API calls)
- AsyncStorage (Local persistence)

## Project Structure

```
src/
├── components/          # Reusable UI components
├── features/            # Feature-based modules
│   ├── namaz/          # Prayer times feature
│   ├── quran/          # Quran reading feature
│   └── profile/         # Profile and settings
├── navigation/          # Navigation configuration
├── services/            # API and business logic services
├── store/               # Zustand state management
├── theme/               # Theme system
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── i18n/                # Internationalization

```

## Setup Instructions

### Prerequisites

- Node.js >= 20
- React Native development environment set up
- Android Studio / Xcode

### Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS:
```bash
cd ios && pod install && cd ..
```

3. Configure Firebase:
   - Add your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Update `src/services/authService.ts` with your Web Client ID

4. Run the app:
```bash
# Android
npm run android

# iOS
npm run ios
```

## Configuration

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Google Sign-In)
3. Enable Firestore
4. Enable Cloud Messaging
5. Add your app to Firebase and download config files

### Google Sign-In

Update `src/services/authService.ts`:
```typescript
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID',
});
```

## Features in Detail

### Prayer Times
- Location-based calculation
- Mark prayers as completed
- Progress tracking
- Current prayer highlighting
- Random Ayah and Hadith display

### Quran
- Surah list with metadata
- Read Surahs with Arabic text
- Turkish translation (meal)
- Tafsir support
- Reading progress tracking

### Profile
- Google Sign-In
- Theme selection
- Language selection
- Daily activity summary
- Google Drive backup (coming soon)

## Development

### Adding a New Theme

1. Add theme definition in `src/theme/themes.ts`
2. Update `ThemeName` type in `src/types/index.ts`
3. Theme will be available in Profile settings

### Adding a New Language

1. Create translation file in `src/i18n/locales/`
2. Add to `src/i18n/index.ts`
3. Update `Language` type in `src/types/index.ts`

## License

Private project - All rights reserved
