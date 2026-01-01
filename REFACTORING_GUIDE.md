# Salah App - Production Refactoring Guide

## Overview

This document outlines the production-grade refactoring completed for the Salah React Native app.

## Architecture Improvements

### 1. Core Services (`src/core/`)

#### NotificationManager
- **Location**: `src/core/NotificationManager.ts`
- **Features**:
  - Robust notification scheduling
  - Handles app killed/background states
  - Device reboot persistence
  - Prayer completion tracking
  - Reminder cancellation on completion
- **Usage**:
```typescript
import NotificationManager from '@core/NotificationManager';

// Initialize
await NotificationManager.initialize(settings);

// Schedule notifications
await NotificationManager.schedulePrayerNotifications(prayerTimes, settings);

// Update on prayer completion
await NotificationManager.updatePrayerCompletion('fajr', true);
```

#### CacheManager
- **Location**: `src/core/CacheManager.ts`
- **Features**:
  - Offline-first caching
  - Network state detection
  - Cache expiration
  - Automatic cache invalidation
- **Usage**:
```typescript
import CacheManager from '@core/CacheManager';

// Cache data
await CacheManager.cachePrayerTimes(prayerTimes, location, date);

// Retrieve cached data
const cached = await CacheManager.getCachedPrayerTimes();

// Check online status
const isOnline = CacheManager.isDeviceOnline();
```

#### Logger
- **Location**: `src/core/Logger.ts`
- **Features**:
  - Centralized logging
  - Log levels (debug, info, warn, error)
  - Performance monitoring
  - Production-ready (Sentry integration ready)
- **Usage**:
```typescript
import Logger from '@core/Logger';

Logger.info('User logged in', { userId: '123' });
Logger.error('API error', error, { endpoint: '/prayers' });
Logger.performance('fetchPrayerTimes', 250);
```

#### CloudSyncService
- **Location**: `src/core/CloudSyncService.ts`
- **Features**:
  - Auto sync on login
  - Manual backup/restore
  - Conflict resolution (merge strategy)
  - Firestore integration
- **Usage**:
```typescript
import CloudSyncService from '@core/CloudSyncService';

// Auto sync on login
await CloudSyncService.syncOnLogin(user);

// Manual backup
const backup = await CloudSyncService.createBackup();

// Restore
await CloudSyncService.restoreFromBackup(backup);
```

### 2. Feature-Based Architecture

Each feature now has:
```
features/
  namaz/
    screens/       # UI components
    components/    # Feature-specific components
    hooks/         # Custom hooks
    services/      # Business logic
    store/         # Feature state
    types/         # TypeScript types
```

#### Namaz Feature

**Services** (`src/features/namaz/services/prayerService.ts`):
- API integration with offline fallback
- Location-based calculations
- Distance calculations

**Hooks** (`src/features/namaz/hooks/usePrayerTimes.ts`):
- Location management
- Prayer times fetching
- Caching integration
- Error handling

**Store** (`src/features/namaz/store/usePrayerStore.ts`):
- Enhanced with streaks
- Statistics (today, week, month)
- Progress tracking

**Usage**:
```typescript
import { usePrayerTimes } from '@features/namaz/hooks/usePrayerTimes';
import { usePrayerStore } from '@features/namaz/store/usePrayerStore';

function NamazScreen() {
  const { prayerTimes, isLoading, refresh } = usePrayerTimes();
  const { markPrayer, stats, streak } = usePrayerStore();
  
  // Use in component
}
```

## Integration Points

### App.tsx Updates Required

```typescript
import NotificationManager from './src/core/NotificationManager';
import { ErrorBoundary } from './src/core/ErrorBoundary';
import Logger from './src/core/Logger';

// Initialize NotificationManager
useEffect(() => {
  const initNotifications = async () => {
    const settings = useSettingsStore.getState().notificationSettings;
    await NotificationManager.initialize(settings);
  };
  initNotifications();
}, []);

// Wrap app with ErrorBoundary
<ErrorBoundary>
  <AppNavigator />
</ErrorBoundary>
```

### Notification Integration

When prayer times are loaded:
```typescript
import NotificationManager from '@core/NotificationManager';

// After fetching prayer times
await NotificationManager.schedulePrayerNotifications(
  prayerTimes,
  notificationSettings
);
```

When prayer is marked:
```typescript
// In markPrayer action
await NotificationManager.updatePrayerCompletion(prayerName, completed);
```

## Next Steps

### 1. Update Existing Screens

Refactor `NamazScreen.tsx` to use new hooks:
- Replace direct service calls with `usePrayerTimes` hook
- Use enhanced store for stats and streaks
- Add offline indicator

### 2. Enhanced Theme System

Create dynamic theme switching:
```typescript
// src/theme/ThemeManager.ts
export const ThemeManager = {
  setTheme: async (themeName: ThemeName) => {
    // Update theme
    // Persist to storage
    // Update all components without reload
  }
};
```

### 3. Quran Module Enhancements

- Audio playback service
- Bookmark system
- Reading streaks
- Background audio support

### 4. Performance Optimizations

- Memoize expensive calculations
- Lazy load screens
- Optimize FlatList rendering
- Image caching

### 5. Security

- Secure storage for tokens
- Encrypt sensitive data
- Firebase security rules
- Input validation

### 6. Testing

- Unit tests for services
- Hook testing
- Notification logic tests
- Integration tests

## Migration Checklist

- [x] Create core services (NotificationManager, CacheManager, Logger)
- [x] Create ErrorBoundary
- [x] Refactor prayer service with offline support
- [x] Create usePrayerTimes hook
- [x] Enhance prayer store with streaks/stats
- [x] Create CloudSyncService
- [ ] Update App.tsx with ErrorBoundary
- [ ] Integrate NotificationManager in App.tsx
- [ ] Refactor NamazScreen to use new hooks
- [ ] Add offline indicators
- [ ] Enhance theme system
- [ ] Add Quran audio features
- [ ] Performance optimizations
- [ ] Security improvements
- [ ] Testing setup

## Dependencies Added

```json
{
  "@react-native-community/netinfo": "^11.3.1"
}
```

## Notes

- All services use singleton pattern for consistency
- Logger is ready for Sentry integration (just uncomment)
- CacheManager handles network state automatically
- NotificationManager persists across app restarts
- CloudSyncService uses merge strategy for conflicts

