import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Card } from './Card';
import { Text } from './Text';
import { formatTime } from '../utils/dateUtils';

interface PrayerCardProps {
  name: string;
  time: Date;
  completed: boolean;
  isCurrent?: boolean;
  onPress: () => void;
  onToggleComplete: () => void;
}

export const PrayerCard: React.FC<PrayerCardProps> = ({
  name,
  time,
  completed,
  isCurrent = false,
  onPress,
  onToggleComplete,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card
        style={[
          styles.card,
          isCurrent && {
            borderColor: theme.colors.accent,
            borderWidth: 2,
            backgroundColor: theme.colors.accent + '10',
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <Text variant="h3" color={isCurrent ? 'primary' : 'text'}>
              {name}
            </Text>
            <Text variant="body" color="textSecondary" style={styles.time}>
              {formatTime(time)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onToggleComplete}
            style={[
              styles.checkbox,
              {
                backgroundColor: completed ? theme.colors.success : 'transparent',
                borderColor: completed ? theme.colors.success : theme.colors.border,
              },
            ]}
          >
            {completed && (
              <Text variant="body" style={styles.checkmark}>
                ✓
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
  },
  time: {
    marginTop: 4,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});

