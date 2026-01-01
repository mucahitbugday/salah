import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Text';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Hadith } from '../../../types';
import { RouteProp } from '@react-navigation/native';
import { NamazStackParamList } from '../../../navigation/types';

type HadithDetailScreenRouteProp = RouteProp<NamazStackParamList, 'HadithDetail'>;

interface Props {
  route: HadithDetailScreenRouteProp;
  navigation: any;
}

export const HadithDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { hadith } = route.params;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Card>
        <Text variant="h2" style={styles.hadithText}>
          {hadith.text}
        </Text>
        <Text variant="caption" color="textSecondary" style={styles.source}>
          {hadith.source}
        </Text>
      </Card>

      {hadith.explanation && (
        <Card style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            {t('quran.tafsir')}
          </Text>
          <Text variant="body" color="textSecondary">
            {hadith.explanation}
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
  hadithText: {
    lineHeight: 28,
    marginBottom: 16,
  },
  source: {
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

