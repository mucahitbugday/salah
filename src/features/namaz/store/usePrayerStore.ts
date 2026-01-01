/**
 * Enhanced Prayer Store with streaks and statistics
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerProgress, PrayerTimes, Location } from '../../../types';
import { PrayerStats, PrayerStreak } from '../types';
import NotificationManager from '../../../core/NotificationManager';
import Logger from '../../../core/Logger';

interface PrayerState {
  prayerTimes: PrayerTimes | null;
  location: Location | null;
  todayProgress: PrayerProgress | null;
  stats: PrayerStats | null;
  streak: PrayerStreak | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPrayerTimes: (times: PrayerTimes) => void;
  setLocation: (location: Location) => void;
  markPrayer: (prayerName: keyof PrayerProgress['prayers'], completed: boolean) => Promise<void>;
  loadTodayProgress: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadStreak: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const PROGRESS_STORAGE_KEY = '@salah:prayerProgress';
const STREAK_STORAGE_KEY = '@salah:prayerStreak';

const getTodayKey = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const getDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const usePrayerStore = create<PrayerState>((set, get) => ({
  prayerTimes: null,
  location: null,
  todayProgress: null,
  stats: null,
  streak: null,
  isLoading: false,
  error: null,

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

      // Update notification manager
      await NotificationManager.updatePrayerCompletion(prayerName, completed);

      // Recalculate stats and streak
      await get().loadStats();
      await get().loadStreak();

      Logger.info(`Prayer ${prayerName} marked as ${completed ? 'completed' : 'not completed'}`);
    } catch (error) {
      Logger.error('Error saving prayer progress', error);
      set({ error: 'Failed to save prayer progress' });
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
      Logger.error('Error loading prayer progress', error);
      set({ error: 'Failed to load prayer progress' });
    }
  },

  loadStats: async () => {
    try {
      const allProgress = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!allProgress) {
        set({ stats: null });
        return;
      }

      const progressMap = JSON.parse(allProgress);
      const today = new Date();
      const weekStart = getWeekStart(today);
      const monthStart = getMonthStart(today);

      // Calculate today's stats
      const todayKey = getTodayKey();
      const todayProgress = progressMap[todayKey] as PrayerProgress | undefined;
      const todayCompleted = todayProgress
        ? Object.values(todayProgress.prayers).filter((p) => p).length
        : 0;

      // Calculate week's stats
      let weekCompleted = 0;
      let weekTotal = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateKey = getDateKey(date);
        const dayProgress = progressMap[dateKey] as PrayerProgress | undefined;
        
        if (dayProgress) {
          const completed = Object.values(dayProgress.prayers).filter((p) => p).length;
          weekCompleted += completed;
          weekTotal += 5;
        } else if (date <= today) {
          weekTotal += 5;
        }
      }

      // Calculate month's stats
      let monthCompleted = 0;
      let monthTotal = 0;
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      for (let i = 0; i <= monthEnd.getDate(); i++) {
        const date = new Date(monthStart);
        date.setDate(i);
        if (date > today) break;
        
        const dateKey = getDateKey(date);
        const dayProgress = progressMap[dateKey] as PrayerProgress | undefined;
        
        if (dayProgress) {
          const completed = Object.values(dayProgress.prayers).filter((p) => p).length;
          monthCompleted += completed;
          monthTotal += 5;
        } else {
          monthTotal += 5;
        }
      }

      const stats: PrayerStats = {
        today: {
          completed: todayCompleted,
          total: 5,
          percentage: (todayCompleted / 5) * 100,
        },
        week: {
          completed: weekCompleted,
          total: weekTotal,
          percentage: weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0,
          streak: 0, // Will be calculated separately
        },
        month: {
          completed: monthCompleted,
          total: monthTotal,
          percentage: monthTotal > 0 ? (monthCompleted / monthTotal) * 100 : 0,
        },
      };

      set({ stats });
    } catch (error) {
      Logger.error('Error loading prayer stats', error);
    }
  },

  loadStreak: async () => {
    try {
      const allProgress = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!allProgress) {
        set({
          streak: {
            currentStreak: 0,
            longestStreak: 0,
            lastPrayerDate: null,
          },
        });
        return;
      }

      const progressMap = JSON.parse(allProgress);
      const today = new Date();
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastPrayerDate: string | null = null;

      // Calculate streaks (going backwards from today)
      for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = getDateKey(date);
        const dayProgress = progressMap[dateKey] as PrayerProgress | undefined;

        if (dayProgress) {
          const completed = Object.values(dayProgress.prayers).filter((p) => p).length;
          const allCompleted = completed === 5;

          if (allCompleted) {
            if (i === 0) {
              currentStreak = 1;
              tempStreak = 1;
            } else if (tempStreak === i) {
              currentStreak++;
              tempStreak++;
            }
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
            
            if (!lastPrayerDate) {
              lastPrayerDate = dateKey;
            }
          } else {
            if (i === 0) {
              // Today is not complete, no current streak
              currentStreak = 0;
            }
            tempStreak = 0;
          }
        } else {
          if (i === 0) {
            currentStreak = 0;
          }
          tempStreak = 0;
        }
      }

      set({
        streak: {
          currentStreak,
          longestStreak,
          lastPrayerDate,
        },
      });
    } catch (error) {
      Logger.error('Error loading prayer streak', error);
    }
  },

  refreshAll: async () => {
    const state = get();
    await Promise.all([
      state.loadTodayProgress(),
      state.loadStats(),
      state.loadStreak(),
    ]);
  },
}));

