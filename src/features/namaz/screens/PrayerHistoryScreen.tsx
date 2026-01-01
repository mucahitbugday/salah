import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { usePrayerStore } from '../../../store/usePrayerStore';
import { Text } from '../../../components/Text';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { PrayerProgress } from '../../../types';

type FilterType = 'daily' | 'weekly' | 'monthly';

interface PrayerHistoryItem {
  date: string;
  dateObj: Date;
  progress: PrayerProgress | null;
  completedCount: number;
  totalCount: number;
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
    const appInstallDate = new Date(); // Uygulama yüklendiği tarih - şimdilik bugün
    appInstallDate.setDate(appInstallDate.getDate() - 30); // Son 30 gün göster

    let startDate: Date;
    let endDate: Date = new Date(today);

    switch (filterType) {
      case 'daily':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7); // Son 7 gün
        break;
      case 'weekly':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 28); // Son 4 hafta
        break;
      case 'monthly':
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 3); // Son 3 ay
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
    }

    // Tarih aralığındaki tüm günleri oluştur
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const progress = allProgress[dateKey] || null;
      
      let completedCount = 0;
      let totalCount = 5;
      if (progress) {
        completedCount = Object.values(progress.prayers).filter((p) => p).length;
      }

      items.push({
        date: dateKey,
        dateObj: new Date(currentDate),
        progress,
        completedCount,
        totalCount,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Tarihe göre ters sırala (en yeni üstte)
    items.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    setHistoryData(items);
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Bugün mü?
    if (date.toDateString() === today.toDateString()) {
      return t('namaz.today');
    }
    
    // Dün mü?
    if (date.toDateString() === yesterday.toDateString()) {
      return t('namaz.yesterday');
    }
    
    // Diğer tarihler için format
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getPrayerStatus = (progress: PrayerProgress | null): string[] => {
    if (!progress) return ['○', '○', '○', '○', '○'];
    return [
      progress.prayers.fajr ? '✓' : '○',
      progress.prayers.dhuhr ? '✓' : '○',
      progress.prayers.asr ? '✓' : '○',
      progress.prayers.maghrib ? '✓' : '○',
      progress.prayers.isha ? '✓' : '○',
    ];
  };

  const renderHistoryItem = ({ item }: { item: PrayerHistoryItem }) => {
    const prayerStatus = getPrayerStatus(item.progress);
    const isToday = item.date === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

    return (
      <View
        style={[
          styles.historyItem,
          {
            backgroundColor: item.progress
              ? theme.colors.surface
              : 'rgba(255, 255, 255, 0.1)',
            borderColor: isToday ? theme.colors.primary : theme.colors.border,
            borderWidth: isToday ? 2 : 1,
          },
        ]}
      >
        <View style={styles.historyItemHeader}>
          <Text variant="body" style={[styles.dateText, { color: theme.colors.text }] as any}>
            {formatDate(item.dateObj)}
          </Text>
          <Text
            variant="caption"
            style={[
              styles.completionText,
              {
                color: item.completedCount === item.totalCount
                  ? theme.colors.success
                  : theme.colors.textSecondary,
              },
            ] as any}
          >
            {item.completedCount}/{item.totalCount}
          </Text>
        </View>
        <View style={styles.prayerStatusRow}>
          <View style={styles.prayerStatusItem}>
            <Text style={styles.prayerStatusIcon}>{prayerStatus[0]}</Text>
            <Text variant="caption" style={styles.prayerStatusLabel}>
              {t('namaz.fajr')}
            </Text>
          </View>
          <View style={styles.prayerStatusItem}>
            <Text style={styles.prayerStatusIcon}>{prayerStatus[1]}</Text>
            <Text variant="caption" style={styles.prayerStatusLabel}>
              {t('namaz.dhuhr')}
            </Text>
          </View>
          <View style={styles.prayerStatusItem}>
            <Text style={styles.prayerStatusIcon}>{prayerStatus[2]}</Text>
            <Text variant="caption" style={styles.prayerStatusLabel}>
              {t('namaz.asr')}
            </Text>
          </View>
          <View style={styles.prayerStatusItem}>
            <Text style={styles.prayerStatusIcon}>{prayerStatus[3]}</Text>
            <Text variant="caption" style={styles.prayerStatusLabel}>
              {t('namaz.maghrib')}
            </Text>
          </View>
          <View style={styles.prayerStatusItem}>
            <Text style={styles.prayerStatusIcon}>{prayerStatus[4]}</Text>
            <Text variant="caption" style={styles.prayerStatusLabel}>
              {t('namaz.isha')}
            </Text>
          </View>
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
        <Text variant="h1" style={styles.title}>
          {t('namaz.history')}
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor:
                filterType === 'daily' ? theme.colors.primary : theme.colors.surface,
              borderColor: theme.colors.border,
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
              backgroundColor:
                filterType === 'weekly' ? theme.colors.primary : theme.colors.surface,
              borderColor: theme.colors.border,
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
              backgroundColor:
                filterType === 'monthly' ? theme.colors.primary : theme.colors.surface,
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

      {/* History List */}
      <FlatList
        data={historyData}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="body" color="textSecondary" style={styles.emptyText}>
              {t('namaz.noHistory')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
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
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  historyItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontWeight: '600',
    fontSize: 16,
  },
  completionText: {
    fontWeight: '600',
    fontSize: 14,
  },
  prayerStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prayerStatusItem: {
    alignItems: 'center',
    flex: 1,
  },
  prayerStatusIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  prayerStatusLabel: {
    fontSize: 10,
    textAlign: 'center',
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

