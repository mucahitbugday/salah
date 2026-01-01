import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { useQuranStore } from '../../../store/useQuranStore';
import { getSurahs } from '../../../services/quranService';
import { Card } from '../../../components/Card';
import { Text } from '../../../components/Text';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { Surah } from '../../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { QuranStackParamList } from '../../../navigation/types';

type QuranScreenNavigationProp = NativeStackNavigationProp<QuranStackParamList, 'QuranHome'>;

interface Props {
  navigation: QuranScreenNavigationProp;
}

export const QuranScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { readingProgress, loadReadingProgress } = useQuranStore();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setLoading(true);
    await loadReadingProgress();
    await loadSurahs();
    setLoading(false);
  };

  const loadSurahs = async () => {
    try {
      const data = await getSurahs();
      setSurahs(data);
    } catch (error) {
      console.error('Error loading surahs:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSurahs();
    setRefreshing(false);
  };

  const getLastReadInfo = (surahNumber: number): string | null => {
    const progress = readingProgress[surahNumber];
    if (progress) {
      return `${t('quran.lastRead')}: ${t('quran.read')} ${progress.lastReadAyah}`;
    }
    return null;
  };

  const renderSurah = ({ item }: { item: Surah }) => {
    const lastRead = getLastReadInfo(item.number);

    return (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('SurahDetail', { surah: item });
        }}
        activeOpacity={0.7}
      >
        <Card style={styles.surahCard}>
          <View style={styles.surahHeader}>
            <View style={styles.surahNumber}>
              <Text variant="h3" style={styles.numberText}>
                {item.number}
              </Text>
            </View>
            <View style={styles.surahInfo}>
              <Text variant="h3">{item.name}</Text>
              <Text variant="body" color="textSecondary" style={styles.arabicName}>
                {item.nameArabic}
              </Text>
              {lastRead && (
                <Text variant="caption" color="textSecondary" style={styles.lastRead}>
                  {lastRead}
                </Text>
              )}
            </View>
            <View style={styles.surahMeta}>
              <Text variant="caption" color="textSecondary">
                {item.ayahCount} {t('quran.read')}
              </Text>
              <Text variant="caption" color="textSecondary" style={styles.revelationType}>
                {item.revelationType === 'makkah' ? 'Mekke' : 'Medine'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="h1">{t('quran.title')}</Text>
      </View>
      <FlatList
        data={surahs}
        renderItem={renderSurah}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  surahCard: {
    marginBottom: 12,
  },
  surahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  surahNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberText: {
    fontWeight: 'bold',
  },
  surahInfo: {
    flex: 1,
  },
  arabicName: {
    marginTop: 4,
  },
  lastRead: {
    marginTop: 4,
  },
  surahMeta: {
    alignItems: 'flex-end',
  },
  revelationType: {
    marginTop: 4,
  },
});

