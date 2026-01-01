import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NamazStackParamList } from './types';
import { NamazScreen } from '../features/namaz/screens/NamazScreen';
import { PrayerDetailScreen } from '../features/namaz/screens/PrayerDetailScreen';
import { AyahDetailScreen } from '../features/namaz/screens/AyahDetailScreen';
import { HadithDetailScreen } from '../features/namaz/screens/HadithDetailScreen';
import { useTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator<NamazStackParamList>();

export const NamazNavigator: React.FC = () => {
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
        name="NamazHome"
        component={NamazScreen}
        options={{ title: 'Namaz', headerShown: false }}
      />
      <Stack.Screen
        name="PrayerDetail"
        component={PrayerDetailScreen}
        options={{ title: 'Namaz Detayı' }}
      />
      <Stack.Screen
        name="AyahDetail"
        component={AyahDetailScreen}
        options={{ title: 'Ayet Detayı' }}
      />
      <Stack.Screen
        name="HadithDetail"
        component={HadithDetailScreen}
        options={{ title: 'Hadis Detayı' }}
      />
    </Stack.Navigator>
  );
};

