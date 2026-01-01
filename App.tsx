import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initI18n } from './src/i18n';
import { loadUserFromStorage } from './src/store/useAuthStore';
import { useSettingsStore } from './src/store/useSettingsStore';
import { usePrayerStore } from './src/store/usePrayerStore';
import { useQuranStore } from './src/store/useQuranStore';
import { requestPermissionWithAlert } from './src/utils/permissions';
import { LoadingSpinner } from './src/components/LoadingSpinner';

function AppContent() {
  const { theme } = useTheme();
  const { loadSettings, language } = useSettingsStore();
  const { loadTodayProgress } = usePrayerStore();
  const { loadReadingProgress } = useQuranStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize i18n
      await initI18n();

      // Load user from storage
      await loadUserFromStorage();

      // Load settings
      await loadSettings();

      // Load prayer progress
      await loadTodayProgress();

      // Load Quran progress
      await loadReadingProgress();

      // Request notification permission
      await requestPermissionWithAlert('notification');

      setIsInitializing(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />
      <AppNavigator />
    </NavigationContainer>
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
