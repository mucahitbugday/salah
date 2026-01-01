import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { RootTabParamList } from './types';
import { NamazNavigator } from './NamazNavigator';
import { QuranNavigator } from './QuranNavigator';
import { ProfileNavigator } from './ProfileNavigator';

const Tab = createBottomTabNavigator<RootTabParamList>();

// Tab icon component
const TabIcon: React.FC<{ icon: string; focused: boolean; color: string }> = ({
  icon,
  focused,
  color,
}) => {
  return (
    <Text
      style={{
        fontSize: focused ? 24 : 20,
        color,
        textAlign: 'center',
      }}
    >
      {icon}
    </Text>
  );
};

export const AppNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: Platform.OS === 'ios' ? 55 + insets.bottom : 60,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Namaz"
        component={NamazNavigator}
        options={{
          // tabBarLabel: t('navigation.namaz'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="🕌" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Quran"
        component={QuranNavigator}
        options={{
          tabBarLabel: t('navigation.quran'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="📖" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: t('navigation.profile'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="👤" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

