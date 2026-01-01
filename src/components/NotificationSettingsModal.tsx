import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
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
          <View style={styles.modalHeader}>
            <Text variant="h2" style={[styles.modalTitle, { color: theme.colors.text }]}>
              {prayerKey ? `${getPrayerName(prayerKey)} - Bildirim Ayarları` : 'Bildirim Ayarları'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text variant="h3" style={[styles.closeButtonText, { color: theme.colors.text }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Enable Notifications */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text variant="body" style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Bildirimleri Aktif Et
                </Text>
                <Text variant="caption" style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Namaz vakitlerinde bildirim al
                </Text>
              </View>
              <Switch
                value={localSettings.enabled}
                onValueChange={(value) =>
                  setLocalSettings({ ...localSettings, enabled: value })
                }
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {localSettings.enabled && (
              <>
                {/* Minutes Before Prayer */}
                <View style={styles.section}>
                  <Text variant="h3" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Bildirim Zamanı
                  </Text>
                  <Text variant="caption" style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                    Namaz vaktinden kaç dakika önce bildirim gelsin?
                  </Text>

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
                                : theme.colors.surface,
                              borderColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.border,
                            },
                          ]}
                          onPress={() =>
                            setLocalSettings({ ...localSettings, minutesBefore: minutes })
                          }
                        >
                          <Text
                            variant="body"
                            style={[
                              styles.optionText,
                              {
                                color: isSelected ? '#FFFFFF' : theme.colors.text,
                                fontWeight: isSelected ? 'bold' : 'normal',
                              },
                            ]}
                          >
                            {minutes} dakika önce
                          </Text>
                          {prayerTime && (
                            <Text
                              variant="caption"
                              style={[
                                styles.optionTime,
                                { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary },
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
                  <Text variant="h3" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Hatırlatma Aralığı
                  </Text>
                  <Text variant="caption" style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                    Namaz kılınmadıysa kaç dakikada bir hatırlatılsın?
                  </Text>

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
                                : theme.colors.surface,
                              borderColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.border,
                            },
                          ]}
                          onPress={() =>
                            setLocalSettings({ ...localSettings, reminderInterval: minutes })
                          }
                        >
                          <Text
                            variant="body"
                            style={[
                              styles.optionText,
                              {
                                color: isSelected ? '#FFFFFF' : theme.colors.text,
                                fontWeight: isSelected ? 'bold' : 'normal',
                              },
                            ]}
                          >
                            {minutes} dakika
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Apply to All */}
                {prayerKey && (
                  <View style={styles.settingRow}>
                    <View style={styles.settingLeft}>
                      <Text variant="body" style={[styles.settingLabel, { color: theme.colors.text }]}>
                        Tüm Vakitlere Uygula
                      </Text>
                      <Text variant="caption" style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                        Bu ayarları tüm namaz vakitlerine uygula
                      </Text>
                    </View>
                    <Switch
                      value={applyToAll}
                      onValueChange={setApplyToAll}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.border }]}
              onPress={onClose}
            >
              <Text variant="body" style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  modalContent: {
    borderRadius: 24,
    width: '90%',
    maxHeight: '85%',
    minHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    flex: 1,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    marginLeft: 16,
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
    fontSize: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    marginBottom: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  optionTime: {
    fontSize: 11,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

