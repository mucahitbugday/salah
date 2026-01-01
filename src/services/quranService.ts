import { Surah, Ayah } from '../types';

// Mock Quran service
// In production, this would fetch from an API or local database
export const getSurahs = async (): Promise<Surah[]> => {
  // Mock data - in production, load from API or local JSON file
  return [
    {
      id: '1',
      number: 1,
      name: 'Al-Fatiha',
      nameArabic: 'الفاتحة',
      ayahCount: 7,
      revelationType: 'makkah',
    },
    {
      id: '2',
      number: 2,
      name: 'Al-Baqarah',
      nameArabic: 'البقرة',
      ayahCount: 286,
      revelationType: 'madinah',
    },
    {
      id: '3',
      number: 3,
      name: 'Ali Imran',
      nameArabic: 'آل عمران',
      ayahCount: 200,
      revelationType: 'madinah',
    },
    // Add more surahs as needed
  ];
};

export const getSurahAyahs = async (surahNumber: number): Promise<Ayah[]> => {
  // Mock data - in production, load from API or local JSON file
  const mockAyahs: Ayah[] = [];
  
  // Example: Al-Fatiha (7 ayahs)
  if (surahNumber === 1) {
    for (let i = 1; i <= 7; i++) {
      mockAyahs.push({
        id: `${surahNumber}-${i}`,
        surahNumber: 1,
        ayahNumber: i,
        arabicText: `بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ${i}`,
        turkishTranslation: `Rahman ve Rahim olan Allah'ın adıyla ${i}`,
        tafsir: `Tefsir açıklaması ${i}`,
      });
    }
  }
  
  return mockAyahs;
};

export const getRandomAyah = async (): Promise<Ayah> => {
  // Mock random ayah
  return {
    id: 'random-1',
    surahNumber: 2,
    ayahNumber: 255,
    arabicText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    turkishTranslation: 'Allah, kendisinden başka hiçbir ilah olmayandır. Diridir, kayyumdur.',
    tafsir: 'Ayet-el Kürsi olarak bilinen bu ayet, Allah\'ın sıfatlarını ve kudretini anlatır.',
  };
};

