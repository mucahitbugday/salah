import { Hadith } from '../types';

// Mock Hadith service
// In production, this would fetch from an API or local database
export const getRandomHadith = async (): Promise<Hadith> => {
  // Mock data - in production, load from API or local JSON file
  const hadiths: Hadith[] = [
    {
      id: '1',
      text: 'Namaz dinin direğidir.',
      source: 'Tirmizi',
      explanation: 'Bu hadis, namazın İslam dinindeki önemini vurgular. Namaz, dinin temel direği olarak kabul edilir ve Müslümanların en önemli ibadetlerinden biridir.',
    },
    {
      id: '2',
      text: 'İman yetmiş küsur şubedir. En üstünü "La ilahe illallah" demek, en düşüğü ise yoldan eziyet veren şeyi kaldırmaktır.',
      source: 'Buhari, Müslim',
      explanation: 'Bu hadis, imanın çeşitli derecelerini ve her birinin değerini açıklar.',
    },
    {
      id: '3',
      text: 'Mümin, mümine karşı bir binanın taşları gibidir. Birbirini sıkıştırır.',
      source: 'Buhari, Müslim',
      explanation: 'Bu hadis, Müslümanlar arasındaki dayanışma ve birliğin önemini vurgular.',
    },
  ];
  
  const randomIndex = Math.floor(Math.random() * hadiths.length);
  return hadiths[randomIndex];
};

