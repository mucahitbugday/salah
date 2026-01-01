import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextStyle,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { usePrayerStore } from '../../../store/usePrayerStore';
import { Text } from '../../../components/Text';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { PrayerProgress } from '../../../types';
import { formatTime } from '../../../utils/dateUtils';
import { getPrayerTimes } from '../../../services/prayerService';

type FilterType = 'daily' | 'weekly' | 'monthly';

interface PrayerHistoryItem {
  date: string;
  dateObj: Date;
  progress: PrayerProgress | null;
  completedCount: number;
  totalCount: number;
}

interface PrayerDetail {
  name: string;
  key: keyof PrayerProgress['prayers'];
  completed: boolean;
  time?: string;
}

export const PrayerHistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { getAllProgress } = usePrayerStore();
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('daily');
  const [allProgress, setAllProgress] = useState<Record<string, PrayerProgress>>({});
  const [historyData, setHistoryData] = useState<PrayerHistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [allProgress, filterType]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const progress = await getAllProgress();
      setAllProgress(progress);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    const today = new Date();
    const items: PrayerHistoryItem[] = [];

    switch (filterType) {
      case 'daily':
        // Sadece bugünü göster
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const todayProgress = allProgress[todayKey] || null;
        let todayCompletedCount = 0;
        if (todayProgress) {
          todayCompletedCount = Object.values(todayProgress.prayers).filter((p) => p).length;
        }
        items.push({
          date: todayKey,
          dateObj: new Date(today),
          progress: todayProgress,
          completedCount: todayCompletedCount,
          totalCount: 5,
        });
        break;

      case 'weekly':
        // Pazartesiden başlayarak son 7 günü göster
        const currentDay = today.getDay(); // 0 = Pazar, 1 = Pazartesi
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Pazartesi = 0
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - daysFromMonday - (6 - i)); // Pazartesiden başla
          
          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const progress = allProgress[dateKey] || null;
          
          let completedCount = 0;
          if (progress) {
            completedCount = Object.values(progress.prayers).filter((p) => p).length;
          }

          items.push({
            date: dateKey,
            dateObj: new Date(date),
            progress,
            completedCount,
            totalCount: 5,
          });
        }
        break;

      case 'monthly':
        // Son 30 günü minimal göster
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const progress = allProgress[dateKey] || null;
          
          let completedCount = 0;
          if (progress) {
            completedCount = Object.values(progress.prayers).filter((p) => p).length;
          }

          items.push({
            date: dateKey,
            dateObj: new Date(date),
            progress,
            completedCount,
            totalCount: 5,
          });
        }
        // Tarihe göre ters sırala (en yeni üstte)
        items.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
        break;
    }

    setHistoryData(items);
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('namaz.today');
    }
    
    if (date.toDateString() === yesterday.toDateString()) {
      return t('namaz.yesterday');
    }
    
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const formatDateShort = (date: Date): string => {
    return `${date.getDate()}.${date.getMonth() + 1}`;
  };

  const getPrayerDetails = async (dateKey: string, translationFn: (key: string) => string): Promise<PrayerDetail[]> => {
    const progress = allProgress[dateKey];
    if (!progress) {
      return [];
    }

    // Mock location - gerçek uygulamada tarih bazlı location kullanılmalı
    const mockLocation = { latitude: 41.0082, longitude: 28.9784 };
    const prayerTimes = await getPrayerTimes(mockLocation);

    const prayerOrder: Array<keyof PrayerProgress['prayers']> = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const prayerNames: Record<keyof PrayerProgress['prayers'], string> = {
      fajr: translationFn('namaz.fajr'),
      dhuhr: translationFn('namaz.dhuhr'),
      asr: translationFn('namaz.asr'),
      maghrib: translationFn('namaz.maghrib'),
      isha: translationFn('namaz.isha'),
    };

    return prayerOrder.map((key) => ({
      name: prayerNames[key],
      key,
      completed: progress.prayers[key],
      time: formatTime(prayerTimes[key]),
    }));
  };

  const DailyViewComponent: React.FC<{ item: PrayerHistoryItem }> = ({ item }) => {
    const { theme: themeContext } = useTheme();
    const { t: tContext } = useTranslation();
    const [prayerDetails, setPrayerDetails] = useState<PrayerDetail[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(true);

    useEffect(() => {
      const loadDetails = async () => {
        setLoadingDetails(true);
        const details = await getPrayerDetails(item.date, tContext);
        setPrayerDetails(details);
        setLoadingDetails(false);
      };
      loadDetails();
    }, [item.date, tContext]);

    return (
      <ScrollView style={styles.dailyContainer} contentContainerStyle={styles.dailyContent}>
        <View style={[styles.dailyCard, { backgroundColor: themeContext.colors.surface, borderColor: themeContext.colors.border }]}>
          <Text variant="h2" style={[styles.dailyDate, { color: themeContext.colors.text }]}>
            {formatDate(item.dateObj)}
          </Text>
          
          {loadingDetails ? (
            <LoadingSpinner />
          ) : (
            <View style={styles.prayerDetailsList}>
              {prayerDetails.map((prayer) => (
                <View
                  key={prayer.key}
                  style={[
                    styles.prayerDetailRow,
                    {
                      backgroundColor: prayer.completed ? 'rgba(52, 199, 89, 0.1)' : 'transparent',
                      borderColor: prayer.completed ? themeContext.colors.success : themeContext.colors.border,
                    },
                  ]}
                >
                  <View style={styles.prayerDetailLeft}>
                    <Text variant="body" style={[styles.prayerDetailName, { color: themeContext.colors.text }]}>
                      {prayer.name}
                    </Text>
                    <Text variant="caption" style={[styles.prayerDetailTime, { color: themeContext.colors.textSecondary }]}>
                      {prayer.time}
                    </Text>
                  </View>
                  <View style={styles.prayerDetailRight}>
                    <Text style={[styles.prayerStatusIcon, { color: prayer.completed ? themeContext.colors.success : themeContext.colors.textSecondary }]}>
                      {prayer.completed ? '✓' : '○'}
                    </Text>
                    {prayer.completed && (
                      <Text variant="caption" style={[styles.prayerMarkedTime, { color: themeContext.colors.textSecondary }]}>
                        {tContext('namaz.marked')}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderDailyView = () => {
    if (historyData.length === 0) return null;
    return <DailyViewComponent item={historyData[0]} />;
  };

  const renderWeeklyView = () => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    
    return (
      <View style={styles.weeklyContainer}>
        <View style={styles.weeklyHeader}>
          {days.map((day, index) => (
            <View key={index} style={styles.weeklyDayHeader}>
              <Text variant="caption" style={[styles.weeklyDayLabel, { color: theme.colors.textSecondary }]}>
                {day}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.weeklyGrid}>
          {historyData.map((item) => {
            const allCompleted = item.completedCount === item.totalCount;
            const someCompleted = item.completedCount > 0;
            
            return (
              <View
                key={item.date}
                style={[
                  styles.weeklyDayCell,
                  {
                    backgroundColor: allCompleted
                      ? theme.colors.success
                      : someCompleted
                      ? 'rgba(255, 193, 7, 0.3)'
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text variant="caption" style={[styles.weeklyDayNumber, { color: theme.colors.text }]}>
                  {item.dateObj.getDate()}
                </Text>
                <Text style={[styles.weeklyStatusIcon, { color: allCompleted ? '#FFFFFF' : theme.colors.textSecondary }]}>
                  {allCompleted ? '✓' : someCompleted ? '○' : '—'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };


  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h1" style={[styles.title, { color: theme.colors.text }]}>
          {t('namaz.history')}
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: filterType === 'daily' ? theme.colors.primary : theme.colors.surface,
              borderColor: theme.colors.border,
              marginRight: 10,
            },
          ]}
          onPress={() => setFilterType('daily')}
        >
          <Text
            variant="body"
            style={[
              styles.filterButtonText,
              {
                color: filterType === 'daily' ? '#FFFFFF' : theme.colors.text,
              },
            ] as TextStyle[]}
          >
            {t('namaz.daily')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: filterType === 'weekly' ? theme.colors.primary : theme.colors.surface,
              borderColor: theme.colors.border,
              marginRight: 10,
            },
          ]}
          onPress={() => setFilterType('weekly')}
        >
          <Text
            variant="body"
            style={[
              styles.filterButtonText,
              {
                color: filterType === 'weekly' ? '#FFFFFF' : theme.colors.text,
              },
            ] as TextStyle[]}
          >
            {t('namaz.weekly')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: filterType === 'monthly' ? theme.colors.primary : theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => setFilterType('monthly')}
        >
          <Text
            variant="body"
            style={[
              styles.filterButtonText,
              {
                color: filterType === 'monthly' ? '#FFFFFF' : theme.colors.text,
              },
            ] as TextStyle[]}
          >
            {t('namaz.monthly')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {filterType === 'daily' && renderDailyView()}
      {filterType === 'weekly' && renderWeeklyView()}
      {filterType === 'monthly' && (
        <FlatList
          data={historyData}
          renderItem={({ item }) => {
            const allCompleted = item.completedCount === item.totalCount;
            const someCompleted = item.completedCount > 0;
            
            return (
              <View
                style={[
                  styles.monthlyItem,
                  {
                    backgroundColor: allCompleted
                      ? theme.colors.success
                      : someCompleted
                      ? 'rgba(255, 193, 7, 0.2)'
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text variant="caption" style={[styles.monthlyDate, { color: theme.colors.text }]}>
                  {formatDateShort(item.dateObj)}
                </Text>
                <Text style={[styles.monthlyStatusIcon, { color: allCompleted ? '#FFFFFF' : theme.colors.textSecondary }]}>
                  {allCompleted ? '✓' : someCompleted ? '○' : '—'}
                </Text>
              </View>
            );
          }}
          keyExtractor={(item) => item.date}
          numColumns={7}
          contentContainerStyle={styles.monthlyListContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="body" color="textSecondary" style={styles.emptyText}>
                {t('namaz.noHistory')}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  // Daily View
  dailyContainer: {
    flex: 1,
  },
  dailyContent: {
    padding: 20,
  },
  dailyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  dailyDate: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  prayerDetailsList: {
    // gap handled by marginBottom in prayerDetailRow
  },
  prayerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  prayerDetailLeft: {
    flex: 1,
  },
  prayerDetailName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  prayerDetailTime: {
    fontSize: 13,
  },
  prayerDetailRight: {
    alignItems: 'flex-end',
  },
  prayerStatusIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prayerMarkedTime: {
    fontSize: 11,
  },
  // Weekly View
  weeklyContainer: {
    padding: 20,
  },
  weeklyHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weeklyDayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyDayLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  weeklyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weeklyDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  weeklyDayNumber: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  weeklyStatusIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Monthly View
  monthlyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
  },
  monthlyListContent: {
    padding: 20,
  },
  monthlyItem: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  monthlyDate: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  monthlyStatusIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
});
