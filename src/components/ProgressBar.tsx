import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0-100
  style?: ViewStyle;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  style,
  height = 8,
}) => {
  const { theme } = useTheme();
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: theme.colors.border,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.progress,
          {
            width: `${clampedProgress}%`,
            backgroundColor: theme.colors.primary,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
  },
});

