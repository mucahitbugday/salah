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
    } catch (error: any) {
      console.error('Sign-in error:', error);
      const errorMessage = error?.message || 'Giriş yapılamadı';
      Alert.alert(t('common.error'), errorMessage);
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
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={[styles.headerSection, { backgroundColor: theme.colors.primary }]}>
        {isAuthenticated && user ? (
          <>
            <View style={styles.avatarContainer}>
              {user.photoUrl ? (
                <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.surface }]}>
                  <Text variant="h1" style={{ color: theme.colors.primary }}>
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <Text variant="h2" style={[styles.name, { color: theme.colors.surface }]}>
              {user.name} {user.surname}
            </Text>
            <Text variant="body" style={{ color: theme.colors.surface, opacity: 0.9 }}>
              {user.email}
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.surface }]}>
              <Text variant="h1" style={{ color: theme.colors.primary }}>
                👤
              </Text>
            </View>
            <Text variant="h2" style={[styles.name, { color: theme.colors.surface }]}>
              {t('profile.title')}
            </Text>
            <Text variant="body" style={{ color: theme.colors.surface, opacity: 0.9, marginBottom: 16 }}>
              {t('profile.signInToContinue')}
            </Text>
            <Button
              title={t('profile.signInWithGoogle')}
              onPress={handleGoogleSignIn}
              loading={loading}
              style={styles.signInButton}
            />
          </>
        )}
      </View>

      {/* Stats Section */}
      {isAuthenticated && (
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text variant="h3" color="primary" style={styles.statNumber}>
              {getPrayersCompleted()}
            </Text>
            <Text variant="caption" color="textSecondary" style={styles.statLabel}>
              {t('profile.prayersCompleted')}
            </Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text variant="h3" color="primary" style={styles.statNumber}>
              {0}
            </Text>
            <Text variant="caption" color="textSecondary" style={styles.statLabel}>
              {t('profile.streak')}
            </Text>
          </Card>
        </View>
      )}

      {/* Settings Section */}
      <Card style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          {t('profile.settings')}
        </Text>

        <View style={styles.settingItem}>
          <View style={styles.settingHeader}>
            <Text variant="h3" style={styles.settingTitle}>
              {t('profile.theme')}
            </Text>
          </View>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              onPress={() => handleThemeChange('theme1')}
              style={[
                styles.themeOption,
                { borderColor: theme.colors.border },
                themeName === 'theme1' && {
                  borderColor: theme.colors.primary,
                  borderWidth: 2,
                  backgroundColor: theme.colors.primary + '10',
                },
              ]}
            >
              <View style={styles.themeColorsRow}>
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
              </View>
              <Text variant="caption" style={styles.themeLabel}>
                Theme 1
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleThemeChange('theme2')}
              style={[
                styles.themeOption,
                { borderColor: theme.colors.border },
                themeName === 'theme2' && {
                  borderColor: theme.colors.primary,
                  borderWidth: 2,
                  backgroundColor: theme.colors.primary + '10',
                },
              ]}
            >
              <View style={styles.themeColorsRow}>
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
              </View>
              <Text variant="caption" style={styles.themeLabel}>
                Theme 2
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingHeader}>
            <Text variant="h3" style={styles.settingTitle}>
              {t('profile.language')}
            </Text>
          </View>
          <View style={styles.languageOptions}>
            <TouchableOpacity
              onPress={() => handleLanguageChange('tr')}
              style={[
                styles.languageOption,
                { borderColor: theme.colors.border },
                language === 'tr' && {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <Text
                variant="body"
                style={[
                  styles.languageText,
                  language === 'tr' && { color: '#FFFFFF', fontWeight: '600' },
                ]}
              >
                🇹🇷 Türkçe
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleLanguageChange('en')}
              style={[
                styles.languageOption,
                { borderColor: theme.colors.border },
                language === 'en' && {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <Text
                variant="body"
                style={[
                  styles.languageText,
                  language === 'en' && { color: '#FFFFFF', fontWeight: '600' },
                ]}
              >
                🇬🇧 English
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Actions Section */}
      {isAuthenticated && (
        <Card style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.border }]}
            onPress={() => {
              Alert.alert(t('profile.backup'), 'Yedekleme özelliği yakında eklenecek');
            }}
          >
            <Text variant="body" style={styles.actionButtonText}>
              💾 {t('profile.backupToGoogleDrive')}
            </Text>
          </TouchableOpacity>
          <Button
            title={t('profile.signOut')}
            onPress={handleSignOut}
            variant="outline"
            style={styles.signOutButton}
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
    paddingBottom: 20,
  },
  headerSection: {
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  name: {
    marginBottom: 8,
    textAlign: 'center',
  },
  signInButton: {
    marginTop: 8,
    minWidth: 200,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 24,
  },
  settingHeader: {
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  themeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  themeColorsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  themeColor: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  languageOption: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  languageText: {
    fontWeight: '500',
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontWeight: '500',
  },
  signOutButton: {
    width: '100%',
  },
});

