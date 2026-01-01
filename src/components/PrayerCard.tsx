import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text as RNText } from 'react-native';
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
  prayerKey?: string; // fajr, dhuhr, asr, maghrib, isha
}

// Prayer icons mapping
const getPrayerIcon = (prayerKey?: string): string => {
  const icons: Record<string, string> = {
    fajr: '🌅',
    dhuhr: '☀️',
    asr: '🌤️',
    maghrib: '🌇',
    isha: '🌙',
  };
  return icons[prayerKey || ''] || '🕌';
};

export const PrayerCard: React.FC<PrayerCardProps> = ({
  name,
  time,
  completed,
  isCurrent = false,
  onPress,
  onToggleComplete,
  prayerKey,
}) => {
  const { theme } = useTheme();
  const icon = getPrayerIcon(prayerKey);

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
          <View style={styles.iconContainer}>
            <RNText style={styles.icon}>{icon}</RNText>
          </View>
          <View style={styles.leftSection}>
            <View style={styles.nameRow}>
              <Text variant="h3" color={isCurrent ? 'primary' : 'text'} style={styles.name}>
                {name}
              </Text>
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
            <Text variant="body" color="textSecondary" style={styles.time}>
              {formatTime(time)}
            </Text>
          </View>
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  leftSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    flex: 1,
  },
  time: {
    marginTop: 0,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

