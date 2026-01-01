import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationSettings, Language } from '../types';

interface SettingsState {
  notificationSettings: NotificationSettings;
  language: Language;
  isLoading: boolean;
  setNotificationSettings: (settings: NotificationSettings) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const SETTINGS_STORAGE_KEY = '@salah:settings';

const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  minutesBefore: 15,
  reminderInterval: 30,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  notificationSettings: defaultNotificationSettings,
  language: 'tr',
  isLoading: true,
  setNotificationSettings: async (settings) => {
    try {
      const currentSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      const allSettings = currentSettings ? JSON.parse(currentSettings) : {};
      allSettings.notifications = settings;
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(allSettings));
      set({ notificationSettings: settings });
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  },
  setLanguage: async (language) => {
    try {
      const currentSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      const allSettings = currentSettings ? JSON.parse(currentSettings) : {};
      allSettings.language = language;
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(allSettings));
      set({ language });
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
  loadSettings: async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (settingsJson) {
        const allSettings = JSON.parse(settingsJson);
        if (allSettings.notifications) {
          set({ notificationSettings: allSettings.notifications });
        }
        if (allSettings.language === 'tr' || allSettings.language === 'en') {
          set({ language: allSettings.language });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));

