import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QuranStackParamList } from './types';
import { QuranScreen } from '../features/quran/screens/QuranScreen';
import { SurahDetailScreen } from '../features/quran/screens/SurahDetailScreen';
import { useTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator<QuranStackParamList>();

export const QuranNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="QuranHome"
        component={QuranScreen}
        options={{ title: "Kur'an" }}
      />
      <Stack.Screen
        name="SurahDetail"
        component={SurahDetailScreen}
        options={{ title: 'Sure Detayı' }}
      />
    </Stack.Navigator>
  );
};

