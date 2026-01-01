/**
 * CacheManager - Offline-first caching layer
 * 
 * Handles:
 * - Prayer times caching
 * - Quran data caching
 * - Hadith & Ayah caching
 * - Cache invalidation
 * - Network state detection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { PrayerTimes, Location, Ayah, Hadith, Surah } from '../types';

const CACHE_KEYS = {
  PRAYER_TIMES: '@salah:cache:prayerTimes',
  PRAYER_TIMES_LOCATION: '@salah:cache:prayerTimesLocation',
  PRAYER_TIMES_DATE: '@salah:cache:prayerTimesDate',
  QURAN_SURAHS: '@salah:cache:quranSurahs',
  QURAN_AYAHS: '@salah:cache:quranAyahs',
  HADITH: '@salah:cache:hadith',
  AYAH: '@salah:cache:ayah',
  LAST_SYNC: '@salah:cache:lastSync',
} as const;

const CACHE_DURATION = {
  PRAYER_TIMES: 24 * 60 * 60 * 1000, // 24 hours
  QURAN_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
  HADITH_AYAH: 60 * 60 * 1000, // 1 hour
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private static instance: CacheManager;
  private isOnline: boolean = true;

  private constructor() {
    this.setupNetworkListener();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Setup network state listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener((state: { isConnected: boolean | null }) => {
      this.isOnline = state.isConnected ?? false;
      console.log('[CacheManager] Network state:', this.isOnline ? 'online' : 'offline');
    });

    // Initial check
    NetInfo.fetch().then((state: { isConnected: boolean | null }) => {
      this.isOnline = state.isConnected ?? false;
    });
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Cache prayer times
   */
  async cachePrayerTimes(
    prayerTimes: PrayerTimes,
    location: Location,
    date: Date
  ): Promise<void> {
    try {
      const cacheEntry: CacheEntry<PrayerTimes> = {
        data: prayerTimes,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION.PRAYER_TIMES,
      };

      await AsyncStorage.setItem(
        CACHE_KEYS.PRAYER_TIMES,
        JSON.stringify(cacheEntry)
      );
      await AsyncStorage.setItem(
        CACHE_KEYS.PRAYER_TIMES_LOCATION,
        JSON.stringify(location)
      );
      await AsyncStorage.setItem(
        CACHE_KEYS.PRAYER_TIMES_DATE,
        date.toISOString()
      );

      console.log('[CacheManager] Prayer times cached');
    } catch (error) {
      console.error('[CacheManager] Error caching prayer times:', error);
    }
  }

  /**
   * Get cached prayer times
   */
  async getCachedPrayerTimes(): Promise<{
    prayerTimes: PrayerTimes;
    location: Location;
    date: Date;
  } | null> {
    try {
      const cacheData = await AsyncStorage.getItem(CACHE_KEYS.PRAYER_TIMES);
      if (!cacheData) return null;

      const cacheEntry: CacheEntry<PrayerTimes> = JSON.parse(cacheData);

      // Check if cache is expired
      if (Date.now() > cacheEntry.expiresAt) {
        await this.invalidatePrayerTimesCache();
        return null;
      }

      const locationData = await AsyncStorage.getItem(
        CACHE_KEYS.PRAYER_TIMES_LOCATION
      );
      const dateData = await AsyncStorage.getItem(CACHE_KEYS.PRAYER_TIMES_DATE);

      if (!locationData || !dateData) return null;

      return {
        prayerTimes: cacheEntry.data,
        location: JSON.parse(locationData),
        date: new Date(dateData),
      };
    } catch (error) {
      console.error('[CacheManager] Error getting cached prayer times:', error);
      return null;
    }
  }

  /**
   * Invalidate prayer times cache
   */
  async invalidatePrayerTimesCache(): Promise<void> {
    await AsyncStorage.multiRemove([
      CACHE_KEYS.PRAYER_TIMES,
      CACHE_KEYS.PRAYER_TIMES_LOCATION,
      CACHE_KEYS.PRAYER_TIMES_DATE,
    ]);
  }

  /**
   * Cache Quran Surahs
   */
  async cacheQuranSurahs(surahs: Surah[]): Promise<void> {
    try {
      const cacheEntry: CacheEntry<Surah[]> = {
        data: surahs,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION.QURAN_DATA,
      };

      await AsyncStorage.setItem(
        CACHE_KEYS.QURAN_SURAHS,
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.error('[CacheManager] Error caching Quran surahs:', error);
    }
  }

  /**
   * Get cached Quran Surahs
   */
  async getCachedQuranSurahs(): Promise<Surah[] | null> {
    try {
      const cacheData = await AsyncStorage.getItem(CACHE_KEYS.QURAN_SURAHS);
      if (!cacheData) return null;

      const cacheEntry: CacheEntry<Surah[]> = JSON.parse(cacheData);

      if (Date.now() > cacheEntry.expiresAt) {
        await AsyncStorage.removeItem(CACHE_KEYS.QURAN_SURAHS);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('[CacheManager] Error getting cached Quran surahs:', error);
      return null;
    }
  }

  /**
   * Cache Quran Ayahs for a surah
   */
  async cacheQuranAyahs(surahNumber: number, ayahs: Ayah[]): Promise<void> {
    try {
      const cacheEntry: CacheEntry<Ayah[]> = {
        data: ayahs,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION.QURAN_DATA,
      };

      await AsyncStorage.setItem(
        `${CACHE_KEYS.QURAN_AYAHS}:${surahNumber}`,
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.error('[CacheManager] Error caching Quran ayahs:', error);
    }
  }

  /**
   * Get cached Quran Ayahs
   */
  async getCachedQuranAyahs(surahNumber: number): Promise<Ayah[] | null> {
    try {
      const cacheData = await AsyncStorage.getItem(
        `${CACHE_KEYS.QURAN_AYAHS}:${surahNumber}`
      );
      if (!cacheData) return null;

      const cacheEntry: CacheEntry<Ayah[]> = JSON.parse(cacheData);

      if (Date.now() > cacheEntry.expiresAt) {
        await AsyncStorage.removeItem(`${CACHE_KEYS.QURAN_AYAHS}:${surahNumber}`);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('[CacheManager] Error getting cached Quran ayahs:', error);
      return null;
    }
  }

  /**
   * Cache Hadith
   */
  async cacheHadith(hadith: Hadith): Promise<void> {
    try {
      const cacheEntry: CacheEntry<Hadith> = {
        data: hadith,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION.HADITH_AYAH,
      };

      await AsyncStorage.setItem(CACHE_KEYS.HADITH, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('[CacheManager] Error caching hadith:', error);
    }
  }

  /**
   * Get cached Hadith
   */
  async getCachedHadith(): Promise<Hadith | null> {
    try {
      const cacheData = await AsyncStorage.getItem(CACHE_KEYS.HADITH);
      if (!cacheData) return null;

      const cacheEntry: CacheEntry<Hadith> = JSON.parse(cacheData);

      if (Date.now() > cacheEntry.expiresAt) {
        await AsyncStorage.removeItem(CACHE_KEYS.HADITH);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('[CacheManager] Error getting cached hadith:', error);
      return null;
    }
  }

  /**
   * Cache Ayah
   */
  async cacheAyah(ayah: Ayah): Promise<void> {
    try {
      const cacheEntry: CacheEntry<Ayah> = {
        data: ayah,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION.HADITH_AYAH,
      };

      await AsyncStorage.setItem(CACHE_KEYS.AYAH, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('[CacheManager] Error caching ayah:', error);
    }
  }

  /**
   * Get cached Ayah
   */
  async getCachedAyah(): Promise<Ayah | null> {
    try {
      const cacheData = await AsyncStorage.getItem(CACHE_KEYS.AYAH);
      if (!cacheData) return null;

      const cacheEntry: CacheEntry<Ayah> = JSON.parse(cacheData);

      if (Date.now() > cacheEntry.expiresAt) {
        await AsyncStorage.removeItem(CACHE_KEYS.AYAH);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('[CacheManager] Error getting cached ayah:', error);
      return null;
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith('@salah:cache:'));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('[CacheManager] All cache cleared');
    } catch (error) {
      console.error('[CacheManager] Error clearing cache:', error);
    }
  }

  /**
   * Get cache size (approximate)
   */
  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith('@salah:cache:'));
      const items = await AsyncStorage.multiGet(cacheKeys);
      
      return items.reduce((size, [, value]) => {
        return size + (value ? value.length : 0);
      }, 0);
    } catch (error) {
      console.error('[CacheManager] Error calculating cache size:', error);
      return 0;
    }
  }
}

export default CacheManager.getInstance();

