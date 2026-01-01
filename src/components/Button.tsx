import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    };

    if (variant === 'primary') {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.primary,
      };
    }
    if (variant === 'secondary') {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.secondary,
      };
    }
    return {
      ...baseStyle,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: theme.typography.body.fontSize,
      fontWeight: theme.typography.body.fontWeight,
    };

    if (variant === 'outline') {
      return {
        ...baseStyle,
        color: theme.colors.primary,
      };
    }
    return {
      ...baseStyle,
      color: '#FFFFFF',
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), disabled && { opacity: 0.5 }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? theme.colors.primary : '#FFFFFF'} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

