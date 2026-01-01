import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerProgress, PrayerTimes, Location } from '../types';
import { getPrayerTimes } from '../services/prayerService';

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
    
    // Vakti gelmemiş namazları işaretlemeyi engelle
    if (completed && state.prayerTimes) {
      const now = new Date();
      const prayerTime = state.prayerTimes[prayerName];
      
      // Eğer namaz vakti henüz gelmediyse işaretlemeye izin verme
      if (now < prayerTime) {
        throw new Error('Namaz vakti henüz gelmedi');
      }
    }
    
    const progress: PrayerProgress = state.todayProgress || {
      date: todayKey,
      prayers: {
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
      },
      markedAt: {},
    };

    progress.prayers[prayerName] = completed;
    
    // İşaretleme zamanını kaydet
    if (!progress.markedAt) {
      progress.markedAt = {};
    }
    
    if (completed) {
      progress.markedAt[prayerName] = new Date().toISOString();
    } else {
      delete progress.markedAt[prayerName];
    }

    try {
      const allProgress = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      const progressMap = allProgress ? JSON.parse(allProgress) : {};
      progressMap[todayKey] = progress;
      await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
      set({ todayProgress: progress });
    } catch (error) {
      console.error('Error saving prayer progress:', error);
      throw error;
    }
  },
  markPrayerForDate: async (dateKey, prayerName, completed) => {
    try {
      const state = get();
      
      // Eğer işaretleme yapılıyorsa (completed = true), vakit kontrolü yap
      if (completed) {
        // Tarih string'ini Date'e çevir
        const [year, month, day] = dateKey.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        
        // Gelecek tarihler için işaretleme yapılamaz
        if (targetDate > today) {
          throw new Error('Gelecek tarihler için namaz işaretlenemez');
        }
        
        // O günün vakitlerini al
        const location = state.location || { latitude: 41.0082, longitude: 28.9784 }; // Default İstanbul
        const prayerTimes = await getPrayerTimes(location, targetDate);
        const prayerTime = prayerTimes[prayerName];
        const now = new Date();
        
        // Bugün için: vakti gelmemişse işaretlemeye izin verme
        if (targetDate.getTime() === today.getTime()) {
          if (now < prayerTime) {
            throw new Error('Namaz vakti henüz gelmedi');
          }
        } else {
          // Geçmiş tarihler için: o namazın vakti o gün geçmiş olmalı
          // O günün sonu (23:59:59) ile karşılaştır
          const endOfThatDay = new Date(targetDate);
          endOfThatDay.setHours(23, 59, 59, 999);
          
          // Eğer o günün sonu henüz gelmemişse (yani dün ise ve henüz o gün bitmemişse)
          // O günün son namaz vakti (isha) geçmiş olmalı
          if (now < endOfThatDay) {
            // Hala o gün içindeyiz, o zaman o namazın vakti geçmiş olmalı
            if (now < prayerTime) {
              throw new Error('Bu namazın vakti henüz gelmedi');
            }
          }
          // Eğer o gün tamamen geçmişse (bugünden önceki bir gün), işaretleme yapılabilir
        }
      }
      
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
        markedAt: {},
      };

      progress.prayers[prayerName] = completed;
      
      // İşaretleme zamanını kaydet
      if (!progress.markedAt) {
        progress.markedAt = {};
      }
      
      if (completed) {
        progress.markedAt[prayerName] = new Date().toISOString();
      } else {
        delete progress.markedAt[prayerName];
      }
      
      progressMap[dateKey] = progress;
      
      await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
      
      // Eğer bugün ise todayProgress'i de güncelle
      const todayKey = getTodayKey();
      if (dateKey === todayKey) {
        set({ todayProgress: progress });
      }
    } catch (error) {
      console.error('Error saving prayer progress for date:', error);
      throw error;
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

