import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  fullScreen = false,
}) => {
  const { theme } = useTheme();

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

