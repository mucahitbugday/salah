// Common types used across the application

export interface PrayerTime {
  name: string;
  time: Date;
  completed: boolean;
}

export interface PrayerTimes {
  fajr: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Ayah {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  turkishTranslation?: string;
  tafsir?: string;
}

export interface Hadith {
  id: string;
  text: string;
  source: string;
  explanation?: string;
}

export interface Surah {
  id: string;
  number: number;
  name: string;
  nameArabic: string;
  ayahCount: number;
  revelationType: 'makkah' | 'madinah';
}

export interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  photoUrl?: string;
  provider: 'google' | 'email';
}

export interface Mosque {
  id: string;
  name: string;
  address: string;
  location: Location;
  distance?: number;
}

export interface PrayerProgress {
  date: string; // YYYY-MM-DD
  prayers: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
}

export interface QuranReadingProgress {
  surahNumber: number;
  lastReadAyah: number;
  lastReadAt: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  minutesBefore: number;
  reminderInterval: number; // minutes
}

export type ThemeName = 'theme1' | 'theme2';

export type Language = 'tr' | 'en';

