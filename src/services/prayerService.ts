import axios from 'axios';
import { PrayerTimes, Location } from '../types';

// Aladhan API - Güvenilir ve ücretsiz namaz vakitleri API
// Method 2 = Diyanet İşleri Başkanlığı (Türkiye)
const ALADHAN_API = 'https://api.aladhan.com/v1/timings';

interface AladhanResponse {
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Maghrib: string;
      Isha: string;
    };
  };
}

/**
 * Diyanet namaz vakitlerini getir (Aladhan API kullanarak)
 */
export const getPrayerTimes = async (
  location: Location,
  date: Date = new Date()
): Promise<PrayerTimes> => {
  try {
    // Unix timestamp
    const timestamp = Math.floor(date.getTime() / 1000);
    
    // Aladhan API'den vakitleri al (Method 13 = Türkiye Diyanet İşleri Başkanlığı)
    const url = `${ALADHAN_API}/${timestamp}`;
    const response = await axios.get<AladhanResponse>(url, {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        method: 13, // Türkiye - Diyanet İşleri Başkanlığı
        school: 0, // Shafi/Maliki/Hanbali (Diyanet standart hesaplama)
      },
      timeout: 10000,
    });

    if (!response.data || !response.data.data || !response.data.data.timings) {
      throw new Error('No prayer times data received');
    }

    const timings = response.data.data.timings;
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);

    // Saat formatını parse et (HH:mm)
    const parseTime = (timeStr: string): Date => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const time = new Date(baseDate);
      time.setHours(hours, minutes, 0, 0);
      return time;
    };

    return {
      fajr: parseTime(timings.Fajr),
      sunrise: parseTime(timings.Sunrise),
      dhuhr: parseTime(timings.Dhuhr),
      asr: parseTime(timings.Asr),
      maghrib: parseTime(timings.Maghrib),
      isha: parseTime(timings.Isha),
    };
  } catch (error) {
    console.error('Error fetching Diyanet prayer times:', error);
    // Fallback: Mock data (bugünün saatine göre)
    const now = new Date();
    const baseDate = new Date(now);
    baseDate.setHours(0, 0, 0, 0);
    
    const fajr = new Date(baseDate);
    fajr.setHours(5, 30, 0, 0);
    const sunrise = new Date(baseDate);
    sunrise.setHours(6, 30, 0, 0);
    const dhuhr = new Date(baseDate);
    dhuhr.setHours(12, 30, 0, 0);
    const asr = new Date(baseDate);
    asr.setHours(16, 0, 0, 0);
    const maghrib = new Date(baseDate);
    maghrib.setHours(19, 0, 0, 0);
    const isha = new Date(baseDate);
    isha.setHours(20, 30, 0, 0);
    
    return {
      fajr,
      sunrise,
      dhuhr,
      asr,
      maghrib,
      isha,
    };
  }
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

