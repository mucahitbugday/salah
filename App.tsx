import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initI18n } from './src/i18n';
import { loadUserFromStorage, useAuthStore } from './src/store/useAuthStore';
import { useSettingsStore } from './src/store/useSettingsStore';
import { usePrayerStore } from './src/store/usePrayerStore';
import { useQuranStore } from './src/store/useQuranStore';
import { requestPermissionWithAlert } from './src/utils/permissions';
import { LoadingSpinner } from './src/components/LoadingSpinner';
import { ErrorBoundary } from './src/core/ErrorBoundary';
import NotificationManager from './src/core/NotificationManager';
import CloudSyncService from './src/core/CloudSyncService';
import Logger from './src/core/Logger';

function AppContent() {
  const { theme } = useTheme();
  const { loadSettings } = useSettingsStore();
  const { loadTodayProgress } = usePrayerStore();
  const { loadReadingProgress } = useQuranStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      Logger.info('Initializing app...');

      // Initialize i18n
      await initI18n();

      // Load user from storage
      await loadUserFromStorage();

      // Load settings
      await loadSettings();
      const settings = useSettingsStore.getState();

      // Initialize NotificationManager
      if (settings.notificationSettings.enabled) {
        await NotificationManager.initialize(settings.notificationSettings);
        Logger.info('NotificationManager initialized');
      }

      // Load prayer progress
      await loadTodayProgress();

      // Load Quran progress
      await loadReadingProgress();

      // Request notification permission
      await requestPermissionWithAlert('notification');

      // Auto sync if user is logged in
      const authStore = useAuthStore.getState();
      if (authStore.isAuthenticated && authStore.user) {
        try {
          await CloudSyncService.syncOnLogin(authStore.user);
          Logger.info('Cloud sync completed');
        } catch (syncError) {
          Logger.error('Cloud sync failed', syncError);
          // Don't block app initialization on sync failure
        }
      }

      Logger.info('App initialization completed');
      setIsInitializing(false);
    } catch (error) {
      Logger.error('Error initializing app', error);
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.primary}
        />
        <AppNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
