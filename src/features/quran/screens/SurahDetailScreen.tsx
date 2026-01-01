import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { useQuranStore } from '../../../store/useQuranStore';
import { getSurahAyahs } from '../../../services/quranService';
import { Card } from '../../../components/Card';
import { Text } from '../../../components/Text';
import { Button } from '../../../components/Button';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { Ayah, Surah } from '../../../types';
import { RouteProp } from '@react-navigation/native';
import { QuranStackParamList } from '../../../navigation/types';

type SurahDetailScreenRouteProp = RouteProp<QuranStackParamList, 'SurahDetail'>;

interface Props {
  route: SurahDetailScreenRouteProp;
  navigation: any;
}

export const SurahDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { surah } = route.params;
  const { setReadingProgress } = useQuranStore();
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTafsir, setShowTafsir] = useState(false);

  useEffect(() => {
    loadAyahs();
  }, []);

  const loadAyahs = async () => {
    try {
      setLoading(true);
      const data = await getSurahAyahs(surah.number);
      setAyahs(data);
    } catch (error) {
      console.error('Error loading ayahs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAyahRead = async (ayah: Ayah) => {
    await setReadingProgress(ayah.surahNumber, ayah.ayahNumber);
  };

  const renderAyah = ({ item }: { item: Ayah }) => {
    return (
      <TouchableOpacity
        onPress={() => handleAyahRead(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.ayahCard}>
          <View style={styles.ayahHeader}>
            <View
              style={[
                styles.ayahNumber,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text variant="caption" style={styles.ayahNumberText}>
                {item.ayahNumber}
              </Text>
            </View>
          </View>
          <Text variant="h3" style={styles.arabicText}>
            {item.arabicText}
          </Text>
          {showTranslation && item.turkishTranslation && (
            <Text variant="body" color="textSecondary" style={styles.translation}>
              {item.turkishTranslation}
            </Text>
          )}
          {showTafsir && item.tafsir && (
            <Text variant="caption" color="textSecondary" style={styles.tafsir}>
              {item.tafsir}
            </Text>
          )}
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
        <Text variant="h1">{surah.name}</Text>
        <Text variant="body" color="textSecondary" style={styles.arabicName}>
          {surah.nameArabic}
        </Text>
        <View style={styles.controls}>
          <Button
            title={showTranslation ? t('quran.translation') : t('quran.translation')}
            onPress={() => setShowTranslation(!showTranslation)}
            variant="outline"
            style={styles.controlButton}
          />
          <Button
            title={showTafsir ? t('quran.tafsir') : t('quran.tafsir')}
            onPress={() => setShowTafsir(!showTafsir)}
            variant="outline"
            style={styles.controlButton}
          />
        </View>
      </View>
      <FlatList
        data={ayahs}
        renderItem={renderAyah}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  arabicName: {
    marginTop: 4,
    textAlign: 'right',
  },
  controls: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  controlButton: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  ayahCard: {
    marginBottom: 16,
  },
  ayahHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  ayahNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  arabicText: {
    textAlign: 'right',
    lineHeight: 40,
    marginBottom: 12,
  },
  translation: {
    marginTop: 8,
    lineHeight: 24,
  },
  tafsir: {
    marginTop: 8,
    fontStyle: 'italic',
  },
});

