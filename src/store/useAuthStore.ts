import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => Promise<void>;
  signOut: () => Promise<void>;
}

const USER_STORAGE_KEY = '@salah:user';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: async (user: User | null) => {
    if (user) {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } else {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      set({ user: null, isAuthenticated: false });
    }
  },
  signOut: async () => {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    set({ user: null, isAuthenticated: false });
  },
}));

// Load user from storage on app start
export const loadUserFromStorage = async () => {
  try {
    const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (userJson) {
      const user = JSON.parse(userJson) as User;
      useAuthStore.getState().setUser(user);
    }
  } catch (error) {
    console.error('Error loading user from storage:', error);
  } finally {
    useAuthStore.setState({ isLoading: false });
  }
};

