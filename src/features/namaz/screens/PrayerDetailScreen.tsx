import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Text';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { formatTime } from '../../../utils/dateUtils';
import { RouteProp } from '@react-navigation/native';
import { NamazStackParamList } from '../../../navigation/types';
import { PrayerTimes } from '../../../types';

type PrayerDetailScreenRouteProp = RouteProp<NamazStackParamList, 'PrayerDetail'>;

interface Props {
  route: PrayerDetailScreenRouteProp;
  navigation: any;
}

export const PrayerDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { prayerName, prayerTime: prayerTimeString } = route.params;
  const prayerTime = new Date(prayerTimeString);

  const getPrayerName = (key: keyof PrayerTimes): string => {
    const names: Record<keyof PrayerTimes, string> = {
      fajr: t('namaz.fajr'),
      dhuhr: t('namaz.dhuhr'),
      asr: t('namaz.asr'),
      maghrib: t('namaz.maghrib'),
      isha: t('namaz.isha'),
    };
    return names[key];
  };

  // Mock prayer steps - in production, load from API or local data
  const prayerSteps = [
    'Niyet edilir',
    'Tekbir getirilir',
    'Fatiha okunur',
    'Zamm-ı sure okunur',
    'Rüku yapılır',
    'Secde yapılır',
    'Tahiyyat okunur',
    'Selam verilir',
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Card>
        <Text variant="h2">{getPrayerName(prayerName)}</Text>
        <Text variant="body" color="textSecondary" style={styles.time}>
          {formatTime(prayerTime)}
        </Text>
      </Card>

      <Card style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          {t('namaz.howToPray')}
        </Text>
        {prayerSteps.map((step, index) => (
          <View key={index} style={styles.step}>
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text variant="body" style={styles.stepNumberText}>
                {index + 1}
              </Text>
            </View>
            <Text variant="body" style={styles.stepText}>
              {step}
            </Text>
          </View>
        ))}
      </Card>

      <Card style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          {t('namaz.prayerVirtues')}
        </Text>
        <Text variant="body" color="textSecondary">
          Bu namazın faziletleri burada gösterilecektir.
        </Text>
      </Card>

      <Button
        title={t('common.close')}
        onPress={() => navigation.goBack()}
        variant="outline"
        style={styles.button}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  time: {
    marginTop: 8,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
  },
  button: {
    marginTop: 24,
  },
});

