import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { RootTabParamList } from './types';
import { NamazNavigator } from './NamazNavigator';
import { QuranNavigator } from './QuranNavigator';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

export const AppNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Namaz"
        component={NamazNavigator}
        options={{
          tabBarLabel: t('navigation.namaz'),
        }}
      />
      <Tab.Screen
        name="Quran"
        component={QuranNavigator}
        options={{
          tabBarLabel: t('navigation.quran'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('navigation.profile'),
        }}
      />
    </Tab.Navigator>
  );
};

