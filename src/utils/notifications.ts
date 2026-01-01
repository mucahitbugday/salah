import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import { NotificationSettings } from '../types';
import i18n from '../i18n';

// Configure push notifications
PushNotification.configure({
  onRegister: function (token) {
    console.log('TOKEN:', token);
  },
  onNotification: function (notification) {
    console.log('NOTIFICATION:', notification);
  },
  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },
  popInitialNotification: true,
  requestPermissions: Platform.OS === 'ios',
});

export const schedulePrayerNotification = (
  prayerName: string,
  prayerTime: Date,
  minutesBefore: number
): void => {
  const notificationTime = new Date(prayerTime);
  notificationTime.setMinutes(notificationTime.getMinutes() - minutesBefore);
  
  const now = new Date();
  if (notificationTime <= now) {
    return; // Don't schedule past notifications
  }
  
  PushNotification.localNotificationSchedule({
    title: i18n.t('notifications.prayerTime', { prayer: prayerName }),
    message: i18n.t('notifications.prayerTime', { prayer: prayerName }),
    date: notificationTime,
    allowWhileIdle: true,
  });
};

export const schedulePrayerReminder = (
  prayerName: string,
  prayerTime: Date,
  reminderInterval: number
): void => {
  const now = new Date();
  let reminderTime = new Date(prayerTime);
  
  // Schedule reminders during prayer time
  while (reminderTime <= new Date(prayerTime.getTime() + 60 * 60 * 1000)) { // 1 hour after prayer time
    if (reminderTime > now) {
      PushNotification.localNotificationSchedule({
        title: i18n.t('notifications.prayerReminder'),
        message: i18n.t('notifications.prayerReminder'),
        date: reminderTime,
        allowWhileIdle: true,
      });
    }
    reminderTime = new Date(reminderTime.getTime() + reminderInterval * 60 * 1000);
  }
};

export const cancelAllNotifications = (): void => {
  PushNotification.cancelAllLocalNotifications();
};

export const setupPrayerNotifications = (
  prayerTimes: Record<string, Date>,
  settings: NotificationSettings
): void => {
  if (!settings.enabled) {
    cancelAllNotifications();
    return;
  }
  
  cancelAllNotifications();
  
  Object.entries(prayerTimes).forEach(([prayerName, prayerTime]) => {
    schedulePrayerNotification(prayerName, prayerTime, settings.minutesBefore);
    schedulePrayerReminder(prayerName, prayerTime, settings.reminderInterval);
  });
};

