import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Text';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Ayah } from '../../../types';
import { RouteProp } from '@react-navigation/native';
import { NamazStackParamList } from '../../../navigation/types';

type AyahDetailScreenRouteProp = RouteProp<NamazStackParamList, 'AyahDetail'>;

interface Props {
  route: AyahDetailScreenRouteProp;
  navigation: any;
}

export const AyahDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { ayah } = route.params;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Card>
        <Text variant="h2" style={styles.arabicText}>
          {ayah.arabicText}
        </Text>
        {ayah.turkishTranslation && (
          <Text variant="body" color="textSecondary" style={styles.translation}>
            {ayah.turkishTranslation}
          </Text>
        )}
        <Text variant="caption" color="textSecondary" style={styles.source}>
          {t('quran.surahs')} {ayah.surahNumber}, {t('quran.read')} {ayah.ayahNumber}
        </Text>
      </Card>

      {ayah.tafsir && (
        <Card style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            {t('quran.tafsir')}
          </Text>
          <Text variant="body" color="textSecondary">
            {ayah.tafsir}
          </Text>
        </Card>
      )}

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
  arabicText: {
    textAlign: 'right',
    lineHeight: 40,
    marginBottom: 16,
  },
  translation: {
    marginTop: 16,
    lineHeight: 24,
  },
  source: {
    marginTop: 16,
    fontStyle: 'italic',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
  },
});

