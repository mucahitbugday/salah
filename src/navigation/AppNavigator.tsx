import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { RootTabParamList } from './types';
import { NamazNavigator } from './NamazNavigator';
import { QuranNavigator } from './QuranNavigator';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';

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

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Namaz"
        component={NamazNavigator}
        options={{
          tabBarLabel: t('navigation.namaz'),
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
        component={ProfileScreen}
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

