import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NamazStackParamList } from './types';
import { NamazScreen } from '../features/namaz/screens/NamazScreen';
import { PrayerDetailScreen } from '../features/namaz/screens/PrayerDetailScreen';
import { PrayerHistoryScreen } from '../features/namaz/screens/PrayerHistoryScreen';
import { AyahDetailScreen } from '../features/namaz/screens/AyahDetailScreen';
import { HadithDetailScreen } from '../features/namaz/screens/HadithDetailScreen';
import { useTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator<NamazStackParamList>();

export const NamazNavigator: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

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
        options={({ navigation }) => ({
          title: 'Namaz',
          headerShown: true,
          headerStyle: {
            backgroundColor: 'transparent',
            height: Platform.OS === 'ios' ? 44 + insets.top : 56 + insets.top,
          },
          headerTransparent: true,
          headerTintColor: '#FFFFFF',
          headerTitle: '',
          headerRight: () => (
            <View style={{ 
              flexDirection: 'row', 
              marginRight: 16, 
              marginTop: Platform.OS === 'ios' ? insets.top : insets.top + 8,
            }}>
              <TouchableOpacity
                onPress={() => {
                  // @ts-ignore - Root navigation
                  navigation.getParent()?.navigate('Quran');
                }}
                style={{ padding: 8, marginRight: 8 }}
              >
                <Text style={{ fontSize: 24 }}>📖</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  // @ts-ignore - Root navigation
                  navigation.getParent()?.navigate('Profile');
                }}
                style={{ padding: 8 }}
              >
                <Text style={{ fontSize: 24 }}>👤</Text>
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="PrayerDetail"
        component={PrayerDetailScreen}
        options={{ title: 'Namaz Detayı' }}
      />
      <Stack.Screen
        name="PrayerHistory"
        component={PrayerHistoryScreen}
        options={{ title: 'Namaz Geçmişi' }}
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

