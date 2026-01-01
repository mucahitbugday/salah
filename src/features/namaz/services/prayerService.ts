/**
 * Prayer Service - Business logic for prayer times
 * 
 * Handles:
 * - Fetching prayer times from API
 * - Offline fallback
 * - Location-based calculations
 */

import axios from 'axios';
import { PrayerTimes, Location } from '../../../types';
import CacheManager from '../../../core/CacheManager';
import Logger from '../../../core/Logger';

const ADHAN_API_BASE = 'https://api.aladhan.com/v1/timings';

interface AdhanApiResponse {
  data: {
    timings: {
      Fajr: string;
      Dhuhr: string;
      Asr: string;
      Maghrib: string;
      Isha: string;
    };
  };
}

/**
 * Get prayer times from API or cache
 */
export const getPrayerTimes = async (
  location: Location,
  date: Date = new Date()
): Promise<PrayerTimes> => {
  const startTime = Date.now();

  try {
    // Check cache first
    const cached = await CacheManager.getCachedPrayerTimes();
    if (cached) {
      const isSameDate = 
        cached.date.toDateString() === date.toDateString() &&
        Math.abs(cached.location.latitude - location.latitude) < 0.01 &&
        Math.abs(cached.location.longitude - location.longitude) < 0.01;

      if (isSameDate) {
        Logger.debug('Using cached prayer times');
        Logger.performance('getPrayerTimes (cached)', Date.now() - startTime);
        return cached.prayerTimes;
      }
    }

    // Fetch from API if online
    if (CacheManager.isDeviceOnline()) {
      const prayerTimes = await fetchPrayerTimesFromAPI(location, date);
      
      // Cache the result
      await CacheManager.cachePrayerTimes(prayerTimes, location, date);
      
      Logger.performance('getPrayerTimes (API)', Date.now() - startTime);
      return prayerTimes;
    } else {
      // Offline: use cache even if date doesn't match
      if (cached) {
        Logger.warn('Offline: using cached prayer times for different date');
        return cached.prayerTimes;
      }
      
      throw new Error('No cached prayer times available and device is offline');
    }
  } catch (error) {
    Logger.error('Error getting prayer times', error);
    
    // Fallback to mock data if everything fails
    return getMockPrayerTimes(date);
  }
};

/**
 * Fetch prayer times from Adhan API
 */
const fetchPrayerTimesFromAPI = async (
  location: Location,
  date: Date
): Promise<PrayerTimes> => {
  try {
    const timestamp = Math.floor(date.getTime() / 1000);
    const url = `${ADHAN_API_BASE}/${timestamp}?latitude=${location.latitude}&longitude=${location.longitude}&method=2`;

    const response = await axios.get<AdhanApiResponse>(url, {
      timeout: 10000,
    });

    const timings = response.data.data.timings;
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);

    return {
      fajr: parseTimeString(timings.Fajr, baseDate),
      dhuhr: parseTimeString(timings.Dhuhr, baseDate),
      asr: parseTimeString(timings.Asr, baseDate),
      maghrib: parseTimeString(timings.Maghrib, baseDate),
      isha: parseTimeString(timings.Isha, baseDate),
    };
  } catch (error) {
    Logger.error('Error fetching from Adhan API', error);
    throw error;
  }
};

/**
 * Parse time string (HH:mm) to Date
 */
const parseTimeString = (timeString: string, baseDate: Date): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Get mock prayer times (fallback)
 */
const getMockPrayerTimes = (date: Date): PrayerTimes => {
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);

  return {
    fajr: new Date(baseDate.getTime() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000), // 05:30
    dhuhr: new Date(baseDate.getTime() + 12 * 60 * 60 * 1000 + 30 * 60 * 1000), // 12:30
    asr: new Date(baseDate.getTime() + 16 * 60 * 60 * 1000), // 16:00
    maghrib: new Date(baseDate.getTime() + 19 * 60 * 60 * 1000), // 19:00
    isha: new Date(baseDate.getTime() + 20 * 60 * 60 * 1000 + 30 * 60 * 1000), // 20:30
  };
};

/**
 * Get current prayer
 */
export const getCurrentPrayer = (
  prayerTimes: PrayerTimes
): keyof PrayerTimes | null => {
  const now = new Date();

  if (now >= prayerTimes.fajr && now < prayerTimes.dhuhr) {
    return 'fajr';
  }
  if (now >= prayerTimes.dhuhr && now < prayerTimes.asr) {
    return 'dhuhr';
  }
  if (now >= prayerTimes.asr && now < prayerTimes.maghrib) {
    return 'asr';
  }
  if (now >= prayerTimes.maghrib && now < prayerTimes.isha) {
    return 'maghrib';
  }
  if (now >= prayerTimes.isha) {
    return 'isha';
  }

  return null;
};

/**
 * Get next prayer
 */
export const getNextPrayer = (
  prayerTimes: PrayerTimes
): keyof PrayerTimes | null => {
  const now = new Date();
  const prayers: Array<keyof PrayerTimes> = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  for (const prayer of prayers) {
    if (now < prayerTimes[prayer]) {
      return prayer;
    }
  }

  // If all prayers passed, next is tomorrow's fajr
  return 'fajr';
};

/**
 * Calculate distance between two locations (Haversine formula)
 */
export const calculateDistance = (
  location1: Location,
  location2: Location
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (location1.latitude * Math.PI) / 180;
  const φ2 = (location2.latitude * Math.PI) / 180;
  const Δφ = ((location2.latitude - location1.latitude) * Math.PI) / 180;
  const Δλ = ((location2.longitude - location1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

