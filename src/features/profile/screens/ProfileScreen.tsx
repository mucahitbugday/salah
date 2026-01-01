import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { usePrayerStore } from '../../../store/usePrayerStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { signInWithGoogle, signOut } from '../../../services/authService';
import { changeLanguage } from '../../../i18n';
import { Card } from '../../../components/Card';
import { Text } from '../../../components/Text';
import { Button } from '../../../components/Button';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ThemeName } from '../../../types';

export const ProfileScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, themeName, setTheme } = useTheme();
  const { user, isAuthenticated, isLoading: authLoading, setUser } = useAuthStore();
  const { todayProgress } = usePrayerStore();
  const { notificationSettings, language, setNotificationSettings, setLanguage } = useSettingsStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Settings are loaded automatically by the store
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const userData = await signInWithGoogle();
      await setUser(userData);
    } catch (error) {
      console.error('Sign-in error:', error);
      Alert.alert(t('common.error'), 'Giriş yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('profile.signOut'),
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              await setUser(null);
            } catch (error) {
              console.error('Sign-out error:', error);
            }
          },
        },
      ]
    );
  };

  const handleThemeChange = async (newTheme: ThemeName) => {
    await setTheme(newTheme);
  };

  const handleLanguageChange = async (newLanguage: 'tr' | 'en') => {
    await setLanguage(newLanguage);
    await changeLanguage(newLanguage);
  };

  const getPrayersCompleted = (): number => {
    if (!todayProgress) return 0;
    return Object.values(todayProgress.prayers).filter((p) => p).length;
  };

  if (authLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {isAuthenticated && user ? (
        <Card style={styles.profileCard}>
          {user.photoUrl && (
            <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
          )}
          <Text variant="h2" style={styles.name}>
            {user.name} {user.surname}
          </Text>
          <Text variant="body" color="textSecondary">
            {user.email}
          </Text>
          <Button
            title={t('profile.signOut')}
            onPress={handleSignOut}
            variant="outline"
            style={styles.signOutButton}
          />
        </Card>
      ) : (
        <Card style={styles.profileCard}>
          <Text variant="h2" style={styles.name}>
            {t('profile.title')}
          </Text>
          <Button
            title={t('profile.signInWithGoogle')}
            onPress={handleGoogleSignIn}
            loading={loading}
            style={styles.signInButton}
          />
        </Card>
      )}

      <Card style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          {t('profile.dailyActivity')}
        </Text>
        <View style={styles.activityItem}>
          <Text variant="body">{t('profile.prayersCompleted')}</Text>
          <Text variant="h3" color="primary">
            {getPrayersCompleted()}/5
          </Text>
        </View>
        <View style={styles.activityItem}>
          <Text variant="body">{t('profile.quranReading')}</Text>
          <Text variant="h3" color="primary">
            {t('quran.readingProgress')}
          </Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          {t('profile.settings')}
        </Text>

        <View style={styles.settingItem}>
          <Text variant="body">{t('profile.theme')}</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              onPress={() => handleThemeChange('theme1')}
              style={[
                styles.themeOption,
                themeName === 'theme1' && {
                  borderColor: theme.colors.primary,
                  borderWidth: 2,
                },
              ]}
            >
              <View
                style={[
                  styles.themeColor,
                  { backgroundColor: '#005461' },
                ]}
              />
              <View
                style={[
                  styles.themeColor,
                  { backgroundColor: '#018790' },
                ]}
              />
              <View
                style={[
                  styles.themeColor,
                  { backgroundColor: '#00B7B5' },
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleThemeChange('theme2')}
              style={[
                styles.themeOption,
                themeName === 'theme2' && {
                  borderColor: theme.colors.primary,
                  borderWidth: 2,
                },
              ]}
            >
              <View
                style={[
                  styles.themeColor,
                  { backgroundColor: '#434E78' },
                ]}
              />
              <View
                style={[
                  styles.themeColor,
                  { backgroundColor: '#607B8F' },
                ]}
              />
              <View
                style={[
                  styles.themeColor,
                  { backgroundColor: '#F7E396' },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text variant="body">{t('profile.language')}</Text>
          <View style={styles.languageOptions}>
            <TouchableOpacity
              onPress={() => handleLanguageChange('tr')}
              style={[
                styles.languageOption,
                language === 'tr' && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
            >
              <Text
                variant="body"
                style={[
                  styles.languageText,
                  language === 'tr' && { color: '#FFFFFF' },
                ]}
              >
                Türkçe
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleLanguageChange('en')}
              style={[
                styles.languageOption,
                language === 'en' && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
            >
              <Text
                variant="body"
                style={[
                  styles.languageText,
                  language === 'en' && { color: '#FFFFFF' },
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {isAuthenticated && (
        <Card style={styles.section}>
          <Button
            title={t('profile.backupToGoogleDrive')}
            onPress={() => {
              Alert.alert(t('profile.backup'), 'Yedekleme özelliği yakında eklenecek');
            }}
            variant="outline"
          />
        </Card>
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
  profileCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    marginBottom: 8,
  },
  signInButton: {
    marginTop: 16,
    width: '100%',
  },
  signOutButton: {
    marginTop: 16,
    width: '100%',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingItem: {
    marginBottom: 24,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  themeOption: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  themeColor: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 4,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  languageOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  languageText: {
    fontWeight: '500',
  },
});

