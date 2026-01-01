import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
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
        options={({ navigation }) => ({
          title: "Kur'an",
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
      <Stack.Screen
        name="SurahDetail"
        component={SurahDetailScreen}
        options={{ title: 'Sure Detayı' }}
      />
    </Stack.Navigator>
  );
};

