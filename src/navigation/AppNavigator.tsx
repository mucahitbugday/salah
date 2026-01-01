import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { NamazNavigator } from './NamazNavigator';
import { QuranNavigator } from './QuranNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { useTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Main"
    >
      <Stack.Screen
        name="Main"
        component={NamazNavigator}
      />
      <Stack.Screen
        name="Quran"
        component={QuranNavigator}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileNavigator}
      />
    </Stack.Navigator>
  );
};
