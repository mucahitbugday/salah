import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { usePrayerStore } from '../../../store/usePrayerStore';
import { getPrayerTimes, getCurrentPrayer, getNextPrayer } from '../../../services/prayerService';
import { getRandomAyah } from '../../../services/quranService';
import { getRandomHadith } from '../../../services/hadithService';
import { requestPermissionWithAlert } from '../../../utils/permissions';
import { Text } from '../../../components/Text';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { formatTime, getTimeUntil } from '../../../utils/dateUtils';
import { PrayerTimes, PrayerProgress, Ayah, Hadith } from '../../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NamazStackParamList } from '../../../navigation/types';
import NotificationManager from '../../../core/NotificationManager';

type NamazScreenNavigationProp = NativeStackNavigationProp<NamazStackParamList, 'NamazHome'>;

interface Props {
  navigation: NamazScreenNavigationProp;
}

export const NamazScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const {
    prayerTimes,
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
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  useEffect(() => {
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prayerTimes) {
      loadRandomContent();
      updateTimeUntilNext();
      // Update countdown every minute
      const interval = setInterval(updateTimeUntilNext, 60000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [prayerTimes]);

  const updateTimeUntilNext = () => {
    if (!prayerTimes) return;
    const next = getNextPrayer(prayerTimes);
    if (next && next !== 'sunrise' && prayerTimes[next]) {
      const nextTime = prayerTimes[next];
      if (nextTime) {
        const timeStr = getTimeUntil(nextTime);
        setTimeUntilNext(timeStr);
      }
    }
  };

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

  const handleTogglePrayer = async (prayerName: keyof PrayerProgress['prayers']) => {
    if (!todayProgress) return;
    const currentStatus = todayProgress.prayers[prayerName];
    try {
      await markPrayer(prayerName, !currentStatus);
    } catch (error: any) {
      // Vakti gelmemişse hata mesajı göster
      Alert.alert('Hata', error.message || 'Namaz vakti henüz gelmedi');
    }
  };

  const getPrayerName = (key: keyof PrayerProgress['prayers']): string => {
    const names: Record<keyof PrayerProgress['prayers'], string> = {
      fajr: t('namaz.fajr'),
      dhuhr: t('namaz.dhuhr'),
      asr: t('namaz.asr'),
      maghrib: t('namaz.maghrib'),
      isha: t('namaz.isha'),
    };
    return names[key];
  };

  const getBackgroundImage = (currentPrayerKey: keyof PrayerProgress['prayers'] | null): any => {
    if (!currentPrayerKey) return require('../../../backround/Fajr.png');

    const imageMap: Record<keyof PrayerProgress['prayers'], any> = {
      fajr: require('../../../backround/Fajr.png'),
      dhuhr: require('../../../backround/Dhuhr.png'),
      asr: require('../../../backround/Asr.png'),
      maghrib: require('../../../backround/Maghrib.png'),
      isha: require('../../../backround/Isha.png'),
    };

    return imageMap[currentPrayerKey] || require('../../../backround/Fajr.png');
  };

  const getTimeUntilPrayer = (prayerKey: keyof PrayerProgress['prayers']): string => {
    if (!prayerTimes) return '';
    const prayerTime = prayerTimes[prayerKey];
    if (!prayerTime) return '';
    return getTimeUntil(prayerTime);
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

  const prayerOrder: Array<keyof PrayerProgress['prayers']> = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <ImageBackground
      source={getBackgroundImage(currentPrayer && currentPrayer !== 'sunrise' ? currentPrayer as keyof PrayerProgress['prayers'] : null)}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Icons */}
        {/* kuran profil sayfasına gitmek için tıklayın */}
        {/* <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => {
              // @ts-ignore - Root navigation
              navigation.getParent()?.navigate('Quran');
            }}
            style={styles.headerIconButton}
          >
            <Text style={styles.headerIcon}>📖</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              // @ts-ignore - Root navigation
              navigation.getParent()?.navigate('Profile');
            }}
            style={styles.headerIconButton}
          >
            <Text style={styles.headerIcon}>👤</Text>
          </TouchableOpacity>
        </View> */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Next Prayer Countdown */}
          {nextPrayer && nextPrayer !== 'sunrise' && timeUntilNext && (
            <View style={styles.countdownContainer}>
              <Text variant="caption" style={styles.countdownLabel}>
                {t('namaz.nextPrayer')}
              </Text>
              <Text variant="h2" style={styles.countdownText}>
                {getPrayerName(nextPrayer as keyof PrayerProgress['prayers'])}
              </Text>
              <Text variant="h1" style={styles.countdownTime}>
                {timeUntilNext}
              </Text>
            </View>
          )}

          {/* Prayer Buttons - 5 buttons side by side */}
          <View style={styles.prayerButtonsContainer}>
            {prayerOrder.map((key) => {
              const completed = todayProgress?.prayers[key] || false;
              const isCurrent = currentPrayer === key;
              const timeUntil = getTimeUntilPrayer(key);
              const prayerTime = prayerTimes[key];

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.prayerButton,
                    completed && styles.prayerButtonCompleted,
                    isCurrent && styles.prayerButtonCurrent,
                  ]}
                  onPress={() => handleTogglePrayer(key)}
                  activeOpacity={0.8}
                >
                  <Text variant="caption" style={styles.prayerButtonLabel}>
                    {getPrayerName(key)}
                  </Text>
                  {prayerTime && (
                    <Text variant="h3" style={styles.prayerButtonTime}>
                      {formatTime(prayerTime)}
                    </Text>
                  )}
                  {completed ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : (
                    <Text variant="caption" style={styles.timeUntil}>
                      {timeUntil}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sunrise Time */}
          {prayerTimes?.sunrise && (
            <View style={[styles.sunriseContainer, { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.25)' }]}>
              <Text variant="caption" style={styles.sunriseLabel}>
                {t('namaz.sunriseTime')}
              </Text>
              <Text variant="h3" style={styles.sunriseTime}>
                {formatTime(prayerTimes.sunrise)}
              </Text>
            </View>
          )}

          {/* Test Notification Button */}
          {/* <TouchableOpacity
            style={[styles.testButton, { backgroundColor: 'rgba(255, 193, 7, 0.3)', borderColor: 'rgba(255, 193, 7, 0.5)' }]}
            onPress={async () => {
              try {
                await NotificationManager.sendTestNotification();
                Alert.alert('Başarılı', 'Test bildirimi gönderildi! Bildirimler çalışıyor.');
              } catch (error: any) {
                Alert.alert('Hata', error.message || 'Bildirim gönderilemedi. Lütfen bildirim izinlerini kontrol edin.');
              }
            }}
            activeOpacity={0.8}
          >
            <Text variant="body" style={styles.testButtonText}>
              🔔 Test Bildirimi
            </Text>
          </TouchableOpacity> */}

          {/* Details Button */}
          <TouchableOpacity
            style={[styles.detailsButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }]}
            onPress={() => navigation.navigate('PrayerHistory')}
            activeOpacity={0.8}
          >
            <Text variant="body" style={styles.detailsButtonText}>
              {t('namaz.details')}
            </Text>
          </TouchableOpacity>

          {/* Ayet ve Hadis - Aşağıda */}
          <View style={styles.contentSection}>
            {randomAyah && (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('AyahDetail', { ayah: randomAyah });
                }}
                activeOpacity={0.8}
              >
                <View style={styles.contentCard}>
                  <Text variant="caption" style={styles.contentLabel}>
                    {t('namaz.randomAyah')}
                  </Text>
                  <Text variant="h3" style={styles.arabicText}>
                    {randomAyah.arabicText}
                  </Text>
                  {randomAyah.turkishTranslation && (
                    <Text variant="body" style={styles.translation}>
                      {randomAyah.turkishTranslation}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {randomHadith && (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('HadithDetail', { hadith: randomHadith });
                }}
                activeOpacity={0.8}
              >
                <View style={styles.contentCard}>
                  <Text variant="caption" style={styles.contentLabel}>
                    {t('namaz.randomHadith')}
                  </Text>
                  <Text variant="body" style={styles.hadithText}>
                    {randomHadith.text}
                  </Text>
                  <Text variant="caption" style={styles.source}>
                    {randomHadith.source}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};


const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  safeArea: {
    flex: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerIcon: {
    fontSize: 24,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  countdownLabel: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
    fontSize: 14,
  },
  countdownText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 24,
  },
  countdownTime: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 48,
  },
  prayerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  prayerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 120,
  },
  prayerButtonCompleted: {
    backgroundColor: 'rgba(52, 199, 89, 0.3)',
    borderColor: 'rgba(52, 199, 89, 0.8)',
  },
  prayerButtonCurrent: {
    backgroundColor: 'rgba(0, 183, 181, 0.3)',
    borderColor: 'rgba(0, 183, 181, 0.8)',
    borderWidth: 3,
  },
  prayerButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 11,
    textAlign: 'center',
  },
  prayerButtonTime: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  timeUntil: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 10,
    textAlign: 'center',
  },
  sunriseContainer: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  sunriseLabel: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  sunriseTime: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 24,
  },
  testButton: {
    marginTop: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 24,
    marginBottom: 30,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    marginBottom: 12,
  },
  progressText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  detailsButton: {
    marginTop: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  contentSection: {
    marginTop: 'auto',
    paddingTop: 40,
    gap: 16,
    width: '100%',
    flexShrink: 0,
  },
  contentCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  contentLabel: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  arabicText: {
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'right',
    lineHeight: 36,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
  },
  translation: {
    marginTop: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 22,
    fontSize: 15,
  },
  hadithText: {
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 26,
    color: '#FFFFFF',
    fontSize: 16,
  },
  source: {
    marginTop: 8,
    color: '#FFFFFF',
    opacity: 0.7,
    fontStyle: 'italic',
    fontSize: 12,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 32,
  },
});

