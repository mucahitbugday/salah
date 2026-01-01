/**
 * usePrayerTimes - Custom hook for prayer times
 * 
 * Handles:
 * - Fetching prayer times
 * - Location management
 * - Caching
 * - Offline support
 */

import { useEffect, useState, useCallback } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { PrayerTimes, Location } from '../../../types';
import { getPrayerTimes } from '../services/prayerService';
import { requestPermissionWithAlert } from '../../../utils/permissions';
import Logger from '../../../core/Logger';
import CacheManager from '../../../core/CacheManager';

interface UsePrayerTimesReturn {
  prayerTimes: PrayerTimes | null;
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DEFAULT_LOCATION: Location = {
  latitude: 41.0082, // Istanbul
  longitude: 28.9784,
};

export const usePrayerTimes = (): UsePrayerTimesReturn => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      const hasPermission = async () => {
        try {
          const granted = await requestPermissionWithAlert(
            'location',
            () => {},
            () => {
              Logger.warn('Location permission denied, using default location');
              resolve(DEFAULT_LOCATION);
            }
          );

          if (!granted) {
            resolve(DEFAULT_LOCATION);
            return;
          }

          Geolocation.getCurrentPosition(
            (position) => {
              const loc: Location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              resolve(loc);
            },
            (err) => {
              Logger.error('Geolocation error', err);
              resolve(DEFAULT_LOCATION);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes
            }
          );
        } catch (err) {
          Logger.error('Error requesting location permission', err);
          resolve(DEFAULT_LOCATION);
        }
      };

      hasPermission();
    });
  }, []);

  const fetchPrayerTimesData = useCallback(async (loc: Location) => {
    try {
      setIsLoading(true);
      setError(null);

      const times = await getPrayerTimes(loc);
      setPrayerTimes(times);
      setLocation(loc);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch prayer times';
      setError(errorMessage);
      Logger.error('Error fetching prayer times', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const loc = await fetchLocation();
    await fetchPrayerTimesData(loc);
  }, [fetchLocation, fetchPrayerTimesData]);

  useEffect(() => {
    // Try to use cached location first
    CacheManager.getCachedPrayerTimes().then((cached) => {
      if (cached) {
        setLocation(cached.location);
        setPrayerTimes(cached.prayerTimes);
        setIsLoading(false);
      }
    });

    // Then fetch fresh data
    refresh();
  }, [refresh]);

  return {
    prayerTimes,
    location,
    isLoading,
    error,
    refresh,
  };
};

