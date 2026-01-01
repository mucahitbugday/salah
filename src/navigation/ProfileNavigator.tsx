import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ProfileStackParamList } from './types';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { useTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

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
        name="ProfileHome"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: t('navigation.profile'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                // @ts-ignore - Root navigation
                navigation.getParent()?.navigate('Main');
              }}
              style={{ marginLeft: 16, padding: 8 }}
            >
              <Text style={{ fontSize: 24 }}>🕌</Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

