import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { usePrayerStore } from '../../../store/usePrayerStore';
import { getPrayerTimes, getCurrentPrayer, getNextPrayer } from '../../../services/prayerService';
import { getRandomAyah } from '../../../services/quranService';
import { getRandomHadith } from '../../../services/hadithService';
import { requestPermissionWithAlert } from '../../../utils/permissions';
import { PrayerCard } from '../../../components/PrayerCard';
import { Card } from '../../../components/Card';
import { Text } from '../../../components/Text';
import { ProgressBar } from '../../../components/ProgressBar';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { formatTime, getTimeUntil } from '../../../utils/dateUtils';
import { PrayerTimes, Ayah, Hadith } from '../../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NamazStackParamList } from '../../../navigation/types';

type NamazScreenNavigationProp = NativeStackNavigationProp<NamazStackParamList, 'NamazHome'>;

interface Props {
  navigation: NamazScreenNavigationProp;
}

export const NamazScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const {
    prayerTimes,
    location,
    todayProgress,
    setPrayerTimes,
    setLocation,
    markPrayer,
    loadTodayProgress,
  } = usePrayerStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [randomAyah, setRandomAyah] = useState<Ayah | null>(null);
  const [randomHadith, setRandomHadith] = useState<Hadith | null>(null);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (prayerTimes) {
      loadRandomContent();
    }
  }, [prayerTimes]);

  const initializeData = async () => {
    setLoading(true);
    await loadTodayProgress();
    await fetchPrayerTimes();
    setLoading(false);
  };

  const fetchPrayerTimes = async () => {
    try {
      // Mock location for now - in production, use Geolocation API
      const mockLocation = {
        latitude: 41.0082,
        longitude: 28.9784,
      };
      
      await requestPermissionWithAlert(
        'location',
        async () => {
          setLocation(mockLocation);
          const times = await getPrayerTimes(mockLocation);
          setPrayerTimes(times);
        },
        () => {
          // Permission denied - use default location
          setLocation(mockLocation);
          getPrayerTimes(mockLocation).then((times) => {
            setPrayerTimes(times);
          });
        }
      );
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      // Fallback to default location
      const mockLocation = {
        latitude: 41.0082,
        longitude: 28.9784,
      };
      const times = await getPrayerTimes(mockLocation);
      setPrayerTimes(times);
    }
  };

  const loadRandomContent = async () => {
    try {
      const [ayah, hadith] = await Promise.all([
        getRandomAyah(),
        getRandomHadith(),
      ]);
      setRandomAyah(ayah);
      setRandomHadith(hadith);
    } catch (error) {
      console.error('Error loading random content:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrayerTimes();
    await loadRandomContent();
    setRefreshing(false);
  };

  const handleTogglePrayer = async (prayerName: keyof PrayerTimes) => {
    if (!todayProgress) return;
    const currentStatus = todayProgress.prayers[prayerName];
    await markPrayer(prayerName, !currentStatus);
  };

  const getPrayerProgress = (): number => {
    if (!todayProgress) return 0;
    const prayers = Object.values(todayProgress.prayers);
    const completed = prayers.filter((p) => p).length;
    return (completed / prayers.length) * 100;
  };

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

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!prayerTimes) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="h2" style={styles.errorText}>
          {t('common.error')}
        </Text>
      </View>
    );
  }

  const currentPrayer = getCurrentPrayer(prayerTimes);
  const nextPrayer = getNextPrayer(prayerTimes);
  const progress = getPrayerProgress();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="h1">{t('namaz.title')}</Text>
        <ProgressBar progress={progress} style={styles.progressBar} />
        <Text variant="caption" color="textSecondary">
          {Math.round(progress)}% {t('namaz.prayerCompleted')}
        </Text>
      </View>

      <View style={styles.prayerList}>
        {(Object.keys(prayerTimes) as Array<keyof PrayerTimes>).map((key) => {
          const isCurrent = currentPrayer === key;
          const completed = todayProgress?.prayers[key] || false;

          return (
            <PrayerCard
              key={key}
              name={getPrayerName(key)}
              time={prayerTimes[key]}
              completed={completed}
              isCurrent={isCurrent}
              prayerKey={key}
              onPress={() => {
                navigation.navigate('PrayerDetail', {
                  prayerName: key,
                  prayerTime: prayerTimes[key].toISOString(),
                });
              }}
              onToggleComplete={() => handleTogglePrayer(key)}
            />
          );
        })}
      </View>

      {randomAyah && (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('AyahDetail', { ayah: randomAyah });
          }}
        >
          <Card style={styles.contentCard}>
            <Text variant="caption" color="textSecondary">
              {t('namaz.randomAyah')}
            </Text>
            <Text variant="h3" style={styles.arabicText}>
              {randomAyah.arabicText}
            </Text>
            {randomAyah.turkishTranslation && (
              <Text variant="body" color="textSecondary" style={styles.translation}>
                {randomAyah.turkishTranslation}
              </Text>
            )}
          </Card>
        </TouchableOpacity>
      )}

      {randomHadith && (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('HadithDetail', { hadith: randomHadith });
          }}
        >
          <Card style={styles.contentCard}>
            <Text variant="caption" color="textSecondary">
              {t('namaz.randomHadith')}
            </Text>
            <Text variant="body" style={styles.hadithText}>
              {randomHadith.text}
            </Text>
            <Text variant="caption" color="textSecondary" style={styles.source}>
              {randomHadith.source}
            </Text>
          </Card>
        </TouchableOpacity>
      )}
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
  header: {
    marginBottom: 24,
  },
  progressBar: {
    marginTop: 12,
    marginBottom: 8,
  },
  prayerList: {
    marginBottom: 24,
  },
  contentCard: {
    marginBottom: 16,
  },
  arabicText: {
    marginTop: 8,
    textAlign: 'right',
    lineHeight: 32,
  },
  translation: {
    marginTop: 8,
  },
  hadithText: {
    marginTop: 8,
    lineHeight: 24,
  },
  source: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 32,
  },
});

