import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuranReadingProgress } from '../types';

interface QuranState {
  readingProgress: Record<number, QuranReadingProgress>;
  isLoading: boolean;
  setReadingProgress: (surahNumber: number, ayahNumber: number) => Promise<void>;
  loadReadingProgress: () => Promise<void>;
}

const QURAN_PROGRESS_STORAGE_KEY = '@salah:quranProgress';

export const useQuranStore = create<QuranState>((set, get) => ({
  readingProgress: {},
  isLoading: false,
  setReadingProgress: async (surahNumber, ayahNumber) => {
    const state = get();
    const progress: QuranReadingProgress = {
      surahNumber,
      lastReadAyah: ayahNumber,
      lastReadAt: new Date(),
    };

    const updatedProgress = {
      ...state.readingProgress,
      [surahNumber]: progress,
    };

    try {
      await AsyncStorage.setItem(
        QURAN_PROGRESS_STORAGE_KEY,
        JSON.stringify(updatedProgress)
      );
      set({ readingProgress: updatedProgress });
    } catch (error) {
      console.error('Error saving Quran progress:', error);
    }
  },
  loadReadingProgress: async () => {
    try {
      const progressJson = await AsyncStorage.getItem(QURAN_PROGRESS_STORAGE_KEY);
      if (progressJson) {
        const progress = JSON.parse(progressJson) as Record<number, QuranReadingProgress>;
        set({ readingProgress: progress });
      }
    } catch (error) {
      console.error('Error loading Quran progress:', error);
    }
  },
}));

