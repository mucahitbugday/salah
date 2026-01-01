import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerProgress, PrayerTimes, Location } from '../types';

interface PrayerState {
  prayerTimes: PrayerTimes | null;
  location: Location | null;
  todayProgress: PrayerProgress | null;
  isLoading: boolean;
  setPrayerTimes: (times: PrayerTimes) => void;
  setLocation: (location: Location) => void;
  markPrayer: (prayerName: keyof PrayerProgress['prayers'], completed: boolean) => Promise<void>;
  markPrayerForDate: (dateKey: string, prayerName: keyof PrayerProgress['prayers'], completed: boolean) => Promise<void>;
  loadTodayProgress: () => Promise<void>;
  getAllProgress: () => Promise<Record<string, PrayerProgress>>;
}

const PROGRESS_STORAGE_KEY = '@salah:prayerProgress';

const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const getDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const usePrayerStore = create<PrayerState>((set, get) => ({
  prayerTimes: null,
  location: null,
  todayProgress: null,
  isLoading: false,
  setPrayerTimes: (times: PrayerTimes) => {
    set({ prayerTimes: times });
  },
  setLocation: (location: Location) => {
    set({ location });
  },
  markPrayer: async (prayerName, completed) => {
    const todayKey = getTodayKey();
    const state = get();
    
    const progress: PrayerProgress = state.todayProgress || {
      date: todayKey,
      prayers: {
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
      },
    };

    progress.prayers[prayerName] = completed;

    try {
      const allProgress = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      const progressMap = allProgress ? JSON.parse(allProgress) : {};
      progressMap[todayKey] = progress;
      await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
      set({ todayProgress: progress });
    } catch (error) {
      console.error('Error saving prayer progress:', error);
    }
  },
  markPrayerForDate: async (dateKey, prayerName, completed) => {
    try {
      const allProgress = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      const progressMap = allProgress ? JSON.parse(allProgress) : {};
      
      const progress: PrayerProgress = progressMap[dateKey] || {
        date: dateKey,
        prayers: {
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false,
        },
      };

      progress.prayers[prayerName] = completed;
      progressMap[dateKey] = progress;
      
      await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
      
      // Eğer bugün ise todayProgress'i de güncelle
      const todayKey = getTodayKey();
      if (dateKey === todayKey) {
        set({ todayProgress: progress });
      }
    } catch (error) {
      console.error('Error saving prayer progress for date:', error);
    }
  },
  loadTodayProgress: async () => {
    try {
      const todayKey = getTodayKey();
      const allProgress = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      if (allProgress) {
        const progressMap = JSON.parse(allProgress);
        const todayProgress = progressMap[todayKey] as PrayerProgress | undefined;
        if (todayProgress) {
          set({ todayProgress });
        } else {
          set({
            todayProgress: {
              date: todayKey,
              prayers: {
                fajr: false,
                dhuhr: false,
                asr: false,
                maghrib: false,
                isha: false,
              },
            },
          });
        }
      } else {
        set({
          todayProgress: {
            date: todayKey,
            prayers: {
              fajr: false,
              dhuhr: false,
              asr: false,
              maghrib: false,
              isha: false,
            },
          },
        });
      }
    } catch (error) {
      console.error('Error loading prayer progress:', error);
    }
  },
  getAllProgress: async () => {
    try {
      const allProgress = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      if (allProgress) {
        return JSON.parse(allProgress) as Record<string, PrayerProgress>;
      }
      return {};
    } catch (error) {
      console.error('Error loading all prayer progress:', error);
      return {};
    }
  },
}));

