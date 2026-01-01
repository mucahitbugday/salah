import { NavigatorScreenParams } from '@react-navigation/native';
import { PrayerTimes, Ayah, Hadith, Surah } from '../types';

export type RootTabParamList = {
  Namaz: NavigatorScreenParams<NamazStackParamList>;
  Quran: NavigatorScreenParams<QuranStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type NamazStackParamList = {
  NamazHome: undefined;
  PrayerDetail: {
    prayerName: keyof PrayerTimes;
    prayerTime: string; // ISO string for serialization
  };
  AyahDetail: {
    ayah: Ayah;
  };
  HadithDetail: {
    hadith: Hadith;
  };
};

export type QuranStackParamList = {
  QuranHome: undefined;
  SurahDetail: {
    surah: Surah;
  };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
};

