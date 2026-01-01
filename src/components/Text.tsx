import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface TextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  color?: 'primary' | 'secondary' | 'text' | 'textSecondary' | 'error' | 'success';
  style?: TextStyle;
  numberOfLines?: number;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color = 'text',
  style,
  numberOfLines,
}) => {
  const { theme } = useTheme();

  const getTextStyle = (): TextStyle => {
    const typography = theme.typography[variant];
    const colorValue = theme.colors[color === 'primary' ? 'primary' : color === 'secondary' ? 'secondary' : color];

    return {
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      color: colorValue,
    };
  };

  return (
    <RNText
      style={[getTextStyle(), style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </RNText>
  );
};

