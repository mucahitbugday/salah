/**
 * NotificationManager - Production-grade notification service
 * 
 * Handles:
 * - Prayer time notifications (X minutes before)
 * - Reminder notifications (if prayer not completed)
 * - Device reboot persistence
 * - App killed state handling
 * - Background/foreground state management
 */

import PushNotification from 'react-native-push-notification';
import { Platform, AppState, AppStateStatus } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationSettings, PrayerTimes } from '../types';
import i18n from '../i18n';

const NOTIFICATION_STORAGE_KEY = '@salah:scheduledNotifications';
const PRAYER_COMPLETION_KEY = '@salah:prayerCompletionStatus';

interface ScheduledNotification {
  id: string;
  prayerName: string;
  prayerTime: string; // ISO string
  type: 'before' | 'reminder';
  scheduledTime: string; // ISO string
}

interface PrayerCompletionStatus {
  [prayerName: string]: boolean;
}

class NotificationManager {
  private static instance: NotificationManager;
  private notificationSettings: NotificationSettings | null = null;
  private prayerTimes: PrayerTimes | null = null;
  private appState: AppStateStatus = AppState.currentState;
  private isInitialized = false;

  private constructor() {
    this.setupAppStateListener();
    this.setupFirebaseMessaging();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Initialize notification system
   */
  async initialize(settings: NotificationSettings): Promise<void> {
    if (this.isInitialized) return;

    this.notificationSettings = settings;
    this.configurePushNotification();
    
    // Request permissions
    await this.requestPermissions();
    
    // Load and reschedule notifications on app start
    await this.loadAndRescheduleNotifications();
    
    this.isInitialized = true;
  }

  /**
   * Configure push notification library
   */
  private configurePushNotification(): void {
    PushNotification.configure({
      onRegister: (token: { token: string }) => {
        console.log('[NotificationManager] Device token:', token.token);
        // Store token for cloud messaging
        AsyncStorage.setItem('@salah:fcmToken', token.token);
      },
      onNotification: (notification: unknown) => {
        console.log('[NotificationManager] Notification received:', notification);
        // Handle notification tap
        this.handleNotificationTap(notification);
      },
      onAction: (notification: unknown) => {
        console.log('[NotificationManager] Notification action:', notification);
      },
      onRegistrationError: (err: Error) => {
        console.error('[NotificationManager] Registration error:', err);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create default channel for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'salah-prayer-times',
          channelName: 'Prayer Times',
          channelDescription: 'Notifications for prayer times',
          playSound: true,
          soundName: 'default',
          importance: 4, // High importance
          vibrate: true,
        },
        (created: boolean) => console.log(`[NotificationManager] Channel created: ${created}`)
      );
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[NotificationManager] Permission granted');
        return true;
      } else {
        console.log('[NotificationManager] Permission denied');
        return false;
      }
    } catch (error) {
      console.error('[NotificationManager] Permission error:', error);
      return false;
    }
  }

  /**
   * Setup Firebase Cloud Messaging
   */
  private setupFirebaseMessaging(): void {
    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('[NotificationManager] Foreground message:', remoteMessage);
      // Show local notification for foreground messages
      PushNotification.localNotification({
        title: remoteMessage.notification?.title || '',
        message: remoteMessage.notification?.body || '',
        channelId: 'salah-prayer-times',
      });
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[NotificationManager] Background message:', remoteMessage);
    });
  }

  /**
   * Setup app state listener for rescheduling
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', async (nextAppState) => {
      if (
        this.appState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - reschedule notifications
        console.log('[NotificationManager] App came to foreground, rescheduling...');
        await this.loadAndRescheduleNotifications();
      }
      this.appState = nextAppState;
    });
  }

  /**
   * Schedule all prayer notifications
   */
  async schedulePrayerNotifications(
    prayerTimes: PrayerTimes,
    settings: NotificationSettings
  ): Promise<void> {
    if (!settings.enabled) {
      await this.cancelAllNotifications();
      return;
    }

    this.prayerTimes = prayerTimes;
    this.notificationSettings = settings;

    // Cancel existing notifications
    await this.cancelAllNotifications();

    const scheduled: ScheduledNotification[] = [];
    const now = new Date();

    // Schedule notification before each prayer
    Object.entries(prayerTimes).forEach(([prayerName, prayerTime]) => {
      const notificationTime = new Date(prayerTime);
      notificationTime.setMinutes(
        notificationTime.getMinutes() - settings.minutesBefore
      );

      if (notificationTime > now) {
        const notificationId = this.scheduleNotification(
          prayerName,
          notificationTime,
          'before',
          i18n.t('notifications.prayerTime', { prayer: this.getPrayerName(prayerName) })
        );

        scheduled.push({
          id: notificationId,
          prayerName,
          prayerTime: prayerTime.toISOString(),
          type: 'before',
          scheduledTime: notificationTime.toISOString(),
        });
      }
    });

    // Save scheduled notifications
    await AsyncStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify(scheduled)
    );

    console.log(`[NotificationManager] Scheduled ${scheduled.length} notifications`);
  }

  /**
   * Schedule reminder notifications for uncompleted prayers
   */
  async scheduleRemindersForUncompletedPrayers(
    prayerTimes: PrayerTimes,
    settings: NotificationSettings
  ): Promise<void> {
    if (!settings.enabled) return;

    const completionStatus = await this.getPrayerCompletionStatus();
    const now = new Date();
    const scheduled: ScheduledNotification[] = [];

    Object.entries(prayerTimes).forEach(([prayerName, prayerTime]) => {
      // Skip if prayer is already completed
      if (completionStatus[prayerName]) return;

      const prayerEndTime = new Date(prayerTime);
      prayerEndTime.setHours(prayerEndTime.getHours() + 1); // 1 hour window

      // Don't schedule if prayer time has passed
      if (now > prayerEndTime) return;

      // Schedule reminders during prayer time
      let reminderTime = new Date(prayerTime);
      while (reminderTime <= prayerEndTime && reminderTime > now) {
        const notificationId = this.scheduleNotification(
          `${prayerName}-reminder-${reminderTime.getTime()}`,
          reminderTime,
          'reminder',
          i18n.t('notifications.prayerReminder')
        );

        scheduled.push({
          id: notificationId,
          prayerName,
          prayerTime: prayerTime.toISOString(),
          type: 'reminder',
          scheduledTime: reminderTime.toISOString(),
        });

        reminderTime = new Date(
          reminderTime.getTime() + settings.reminderInterval * 60 * 1000
        );
      }
    });

    // Append to existing scheduled notifications
    const existing = await this.getScheduledNotifications();
    await AsyncStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify([...existing, ...scheduled])
    );
  }

  /**
   * Cancel reminders for a specific prayer when marked as completed
   */
  async cancelRemindersForPrayer(prayerName: string): Promise<void> {
    const scheduled = await this.getScheduledNotifications();
    const filtered = scheduled.filter(
      (n) => !(n.prayerName === prayerName && n.type === 'reminder')
    );

    // Cancel notification IDs
    scheduled
      .filter((n) => n.prayerName === prayerName && n.type === 'reminder')
      .forEach((n) => {
        PushNotification.cancelLocalNotifications({ id: n.id });
      });

    await AsyncStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify(filtered)
    );

    // Update completion status
    const completionStatus = await this.getPrayerCompletionStatus();
    completionStatus[prayerName] = true;
    await AsyncStorage.setItem(
      PRAYER_COMPLETION_KEY,
      JSON.stringify(completionStatus)
    );
  }

  /**
   * Update prayer completion status
   */
  async updatePrayerCompletion(
    prayerName: string,
    completed: boolean
  ): Promise<void> {
    const completionStatus = await this.getPrayerCompletionStatus();
    completionStatus[prayerName] = completed;

    await AsyncStorage.setItem(
      PRAYER_COMPLETION_KEY,
      JSON.stringify(completionStatus)
    );

    if (completed) {
      // Cancel reminders for this prayer
      await this.cancelRemindersForPrayer(prayerName);
    } else {
      // Reschedule reminders if prayer times are available
      if (this.prayerTimes && this.notificationSettings) {
        await this.scheduleRemindersForUncompletedPrayers(
          this.prayerTimes,
          this.notificationSettings
        );
      }
    }
  }

  /**
   * Schedule a single notification
   */
  private scheduleNotification(
    id: string,
    date: Date,
    type: 'before' | 'reminder',
    message: string
  ): string {
    PushNotification.localNotificationSchedule({
      id,
      title: 'Salah',
      message,
      date,
      allowWhileIdle: true,
      channelId: 'salah-prayer-times',
      soundName: 'default',
      vibrate: true,
      userInfo: {
        type,
        id,
      },
    });

    return id;
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    PushNotification.cancelAllLocalNotifications();
    await AsyncStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    await AsyncStorage.removeItem(PRAYER_COMPLETION_KEY);
  }

  /**
   * Load and reschedule notifications (for app restart/reboot)
   */
  private async loadAndRescheduleNotifications(): Promise<void> {
    if (!this.prayerTimes || !this.notificationSettings) return;

    const scheduled = await this.getScheduledNotifications();
    const now = new Date();

    // Filter out past notifications
    const validNotifications = scheduled.filter(
      (n) => new Date(n.scheduledTime) > now
    );

    // Reschedule valid notifications
    validNotifications.forEach((n) => {
      this.scheduleNotification(
        n.id,
        new Date(n.scheduledTime),
        n.type,
        n.type === 'before'
          ? i18n.t('notifications.prayerTime', { prayer: this.getPrayerName(n.prayerName) })
          : i18n.t('notifications.prayerReminder')
      );
    });

    // Reschedule reminders for uncompleted prayers
    await this.scheduleRemindersForUncompletedPrayers(
      this.prayerTimes,
      this.notificationSettings
    );
  }

  /**
   * Get scheduled notifications from storage
   */
  private async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[NotificationManager] Error loading notifications:', error);
      return [];
    }
  }

  /**
   * Get prayer completion status
   */
  private async getPrayerCompletionStatus(): Promise<PrayerCompletionStatus> {
    try {
      const data = await AsyncStorage.getItem(PRAYER_COMPLETION_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('[NotificationManager] Error loading completion status:', error);
      return {};
    }
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(notification: unknown): void {
    // Navigate to appropriate screen based on notification type
    console.log('[NotificationManager] Notification tapped:', notification);
    // This will be handled by navigation listener
  }

  /**
   * Get prayer name in current language
   */
  private getPrayerName(prayerName: string): string {
    const prayerNames: Record<string, string> = {
      fajr: i18n.t('namaz.fajr'),
      dhuhr: i18n.t('namaz.dhuhr'),
      asr: i18n.t('namaz.asr'),
      maghrib: i18n.t('namaz.maghrib'),
      isha: i18n.t('namaz.isha'),
    };
    return prayerNames[prayerName] || prayerName;
  }

  /**
   * Update settings
   */
  async updateSettings(settings: NotificationSettings): Promise<void> {
    this.notificationSettings = settings;
    if (this.prayerTimes) {
      await this.schedulePrayerNotifications(this.prayerTimes, settings);
    }
  }
}

export default NotificationManager.getInstance();

