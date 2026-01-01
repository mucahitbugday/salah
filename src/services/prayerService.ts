import { PrayerTimes, Location } from '../types';

// Mock prayer times service
// In production, this would call an API like adhan.xyz or similar
export const getPrayerTimes = async (
  location: Location,
  date: Date = new Date()
): Promise<PrayerTimes> => {
  // Mock implementation - in production, use a real API
  // Example: https://api.aladhan.com/v1/timings/${date.getTime()/1000}?latitude=${location.latitude}&longitude=${location.longitude}&method=2
  
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Mock times based on current time
  const fajr = new Date(now);
  fajr.setHours(5, 30, 0, 0);
  
  const dhuhr = new Date(now);
  dhuhr.setHours(12, 30, 0, 0);
  
  const asr = new Date(now);
  asr.setHours(16, 0, 0, 0);
  
  const maghrib = new Date(now);
  maghrib.setHours(19, 0, 0, 0);
  
  const isha = new Date(now);
  isha.setHours(20, 30, 0, 0);
  
  return {
    fajr,
    dhuhr,
    asr,
    maghrib,
    isha,
  };
};

export const getCurrentPrayer = (prayerTimes: PrayerTimes): keyof PrayerTimes | null => {
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

export const getNextPrayer = (prayerTimes: PrayerTimes): keyof PrayerTimes | null => {
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

