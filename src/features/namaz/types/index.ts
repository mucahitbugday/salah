/**
 * Namaz feature types
 */

import { PrayerTimes, Location, PrayerProgress } from '../../../types';

export interface PrayerStats {
  today: {
    completed: number;
    total: number;
    percentage: number;
  };
  week: {
    completed: number;
    total: number;
    percentage: number;
    streak: number;
  };
  month: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export interface PrayerStreak {
  currentStreak: number;
  longestStreak: number;
  lastPrayerDate: string | null;
}

export interface Fazilet {
  prayerName: keyof PrayerTimes;
  title: string;
  description: string;
  source?: string;
}

export interface Mosque {
  id: string;
  name: string;
  address: string;
  location: Location;
  distance: number; // in meters
}

export interface NamazState {
  prayerTimes: PrayerTimes | null;
  location: Location | null;
  todayProgress: PrayerProgress | null;
  stats: PrayerStats | null;
  streak: PrayerStreak | null;
  isLoading: boolean;
  error: string | null;
}

