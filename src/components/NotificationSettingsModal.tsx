import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { Text } from './Text';
import { NotificationSettings, PrayerProgress } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import NotificationManager from '../core/NotificationManager';
import { formatTime } from '../utils/dateUtils';
import { PrayerTimes } from '../types';

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  prayerKey: keyof PrayerProgress['prayers'] | null;
  prayerTime: Date | null;
  prayerTimes: PrayerTimes | null;
  onApplyToAll?: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  visible,
  onClose,
  prayerKey,
  prayerTime,
  prayerTimes,
  onApplyToAll,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { notificationSettings, setNotificationSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(notificationSettings);
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    if (visible) {
      setLocalSettings(notificationSettings);
      setApplyToAll(false);
    }
  }, [visible, notificationSettings]);

  const handleSave = async () => {
    try {
      await setNotificationSettings(localSettings);
      
      // Update NotificationManager
      if (prayerTimes) {
        await NotificationManager.updateSettings(localSettings);
        await NotificationManager.schedulePrayerNotifications(prayerTimes, localSettings);
      }
      
      Alert.alert('Başarılı', 'Bildirim ayarları kaydedildi.');
      onClose();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Ayarlar kaydedilemedi.');
    }
  };

  const getPrayerName = (key: keyof PrayerProgress['prayers'] | null): string => {
    if (!key) return '';
    const names: Record<keyof PrayerProgress['prayers'], string> = {
      fajr: t('namaz.fajr'),
      dhuhr: t('namaz.dhuhr'),
      asr: t('namaz.asr'),
      maghrib: t('namaz.maghrib'),
      isha: t('namaz.isha'),
    };
    return names[key];
  };

  const calculateNotificationTime = (minutesBefore: number): string => {
    if (!prayerTime) return '';
    const notificationTime = new Date(prayerTime);
    notificationTime.setMinutes(notificationTime.getMinutes() - minutesBefore);
    return formatTime(notificationTime);
  };

  const minutesOptions = [5, 10, 15, 30, 60];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerContent}>
              <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Text style={[styles.iconText, { color: theme.colors.primary }]}>🔔</Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text variant="h2" style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Bildirim Ayarları
                </Text>
                {prayerKey && (
                  <Text variant="caption" style={[styles.prayerSubtitle, { color: theme.colors.textSecondary }]}>
                    {getPrayerName(prayerKey)} vakti
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.closeButton, { backgroundColor: theme.colors.background }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.textSecondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Enable Notifications */}
            <View style={[styles.settingCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Text style={[styles.settingIcon, { color: localSettings.enabled ? theme.colors.primary : theme.colors.textSecondary }]}>
                    {localSettings.enabled ? '🔔' : '🔕'}
                  </Text>
                </View>
                <View style={styles.settingTextContainer}>
                  <Text variant="body" style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Bildirimleri Aktif Et
                  </Text>
                  <Text variant="caption" style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Namaz vakitlerinde bildirim al
                  </Text>
                </View>
              </View>
              <Switch
                value={localSettings.enabled}
                onValueChange={(value) =>
                  setLocalSettings({ ...localSettings, enabled: value })
                }
                trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.colors.border}
              />
            </View>

            {localSettings.enabled && (
              <>
                {/* Minutes Before Prayer */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionIcon, { color: theme.colors.primary }]}>⏰</Text>
                    <View style={styles.sectionHeaderText}>
                      <Text variant="h3" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Bildirim Zamanı
                      </Text>
                      <Text variant="caption" style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                        Namaz vaktinden kaç dakika önce bildirim gelsin?
                      </Text>
                    </View>
                  </View>

                  <View style={styles.optionsContainer}>
                    {minutesOptions.map((minutes) => {
                      const isSelected = localSettings.minutesBefore === minutes;
                      const notificationTime = calculateNotificationTime(minutes);
                      
                      return (
                        <TouchableOpacity
                          key={minutes}
                          style={[
                            styles.optionButton,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.background,
                              borderColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.border,
                              ...(isSelected ? styles.optionButtonSelected : {}),
                            },
                          ]}
                          onPress={() =>
                            setLocalSettings({ ...localSettings, minutesBefore: minutes })
                          }
                          activeOpacity={0.7}
                        >
                          <Text
                            variant="body"
                            style={[
                              styles.optionText,
                              {
                                color: isSelected ? '#FFFFFF' : theme.colors.text,
                                fontWeight: isSelected ? '700' : '600',
                              },
                            ]}
                          >
                            {minutes} dk
                          </Text>
                          {prayerTime && (
                            <Text
                              variant="caption"
                              style={[
                                styles.optionTime,
                                { color: isSelected ? 'rgba(255,255,255,0.9)' : theme.colors.textSecondary },
                              ]}
                            >
                              {notificationTime}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Reminder Interval */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionIcon, { color: theme.colors.primary }]}>🔄</Text>
                    <View style={styles.sectionHeaderText}>
                      <Text variant="h3" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Hatırlatma Aralığı
                      </Text>
                      <Text variant="caption" style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                        Namaz kılınmadıysa kaç dakikada bir hatırlatılsın?
                      </Text>
                    </View>
                  </View>

                  <View style={styles.optionsContainer}>
                    {[15, 30, 60, 120].map((minutes) => {
                      const isSelected = localSettings.reminderInterval === minutes;
                      
                      return (
                        <TouchableOpacity
                          key={minutes}
                          style={[
                            styles.optionButton,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.background,
                              borderColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.border,
                              ...(isSelected ? styles.optionButtonSelected : {}),
                            },
                          ]}
                          onPress={() =>
                            setLocalSettings({ ...localSettings, reminderInterval: minutes })
                          }
                          activeOpacity={0.7}
                        >
                          <Text
                            variant="body"
                            style={[
                              styles.optionText,
                              {
                                color: isSelected ? '#FFFFFF' : theme.colors.text,
                                fontWeight: isSelected ? '700' : '600',
                              },
                            ]}
                          >
                            {minutes} dk
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Apply to All */}
                {prayerKey && (
                  <View style={[styles.settingCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <View style={styles.settingLeft}>
                      <View style={styles.settingIconContainer}>
                        <Text style={[styles.settingIcon, { color: applyToAll ? theme.colors.primary : theme.colors.textSecondary }]}>
                          {applyToAll ? '✅' : '⚙️'}
                        </Text>
                      </View>
                      <View style={styles.settingTextContainer}>
                        <Text variant="body" style={[styles.settingLabel, { color: theme.colors.text }]}>
                          Tüm Vakitlere Uygula
                        </Text>
                        <Text variant="caption" style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                          Bu ayarları tüm namaz vakitlerine uygula
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={applyToAll}
                      onValueChange={setApplyToAll}
                      trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor={theme.colors.border}
                    />
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text variant="body" style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text variant="body" style={styles.saveButtonText}>
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 28,
    width: '90%',
    maxHeight: '85%',
    minHeight: '80%',
    paddingBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 22,
    marginBottom: 4,
  },
  prayerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    flex: 1,
    padding: 24,
  },
  settingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  settingIconContainer: {
    marginRight: 12,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginHorizontal: -6,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    margin: 6,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  optionButtonSelected: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  optionText: {
    fontSize: 15,
    marginBottom: 2,
  },
  optionTime: {
    fontSize: 11,
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

