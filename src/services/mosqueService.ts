import { Mosque, Location } from '../types';

// Mock mosque service
// In production, this would use Google Places API or similar
export const getNearbyMosques = async (
  location: Location,
  radius: number = 5000
): Promise<Mosque[]> => {
  // Mock data - in production, use Google Places API
  return [
    {
      id: '1',
      name: 'Sultanahmet Camii',
      address: 'Sultanahmet, Fatih, İstanbul',
      location: {
        latitude: 41.0055,
        longitude: 28.9774,
      },
      distance: 1.2,
    },
    {
      id: '2',
      name: 'Süleymaniye Camii',
      address: 'Süleymaniye, Fatih, İstanbul',
      location: {
        latitude: 41.0160,
        longitude: 28.9639,
      },
      distance: 2.5,
    },
  ];
};

