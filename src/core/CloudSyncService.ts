/**
 * CloudSyncService - Handles cloud synchronization
 * 
 * Features:
 * - Auto sync on login
 * - Manual backup/restore
 * - Google Drive integration
 * - Conflict resolution
 */

import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, PrayerProgress, QuranReadingProgress } from '../types';
import Logger from './Logger';
// Removed unused import

interface BackupData {
  prayers: Record<string, PrayerProgress>;
  quran: Record<number, QuranReadingProgress>;
  settings: unknown;
  timestamp: string;
  version: string;
}

class CloudSyncService {
  private static instance: CloudSyncService;
  private isSyncing = false;

  private constructor() {}

  static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  /**
   * Auto sync on login
   */
  async syncOnLogin(user: User): Promise<void> {
    if (this.isSyncing) {
      Logger.warn('Sync already in progress');
      return;
    }

    this.isSyncing = true;
    try {
      Logger.info('Starting cloud sync on login');
      
      // Sync prayers
      await this.syncPrayers(user.id);
      
      // Sync Quran progress
      await this.syncQuranProgress(user.id);
      
      // Sync settings
      await this.syncSettings(user.id);
      
      Logger.info('Cloud sync completed');
    } catch (error) {
      Logger.error('Error during cloud sync', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync prayer progress to cloud
   */
  async syncPrayers(userId: string): Promise<void> {
    try {
      const progressData = await AsyncStorage.getItem('@salah:prayerProgress');
      if (!progressData) return;

      const progress = JSON.parse(progressData);
      
      const userRef = firestore().collection('users').doc(userId);
      await userRef.set(
        {
          prayerProgress: progress,
          lastSynced: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      Logger.info('Prayer progress synced to cloud');
    } catch (error) {
      Logger.error('Error syncing prayers', error);
      throw error;
    }
  }

  /**
   * Sync Quran reading progress
   */
  async syncQuranProgress(userId: string): Promise<void> {
    try {
      const quranData = await AsyncStorage.getItem('@salah:quranProgress');
      if (!quranData) return;

      const progress = JSON.parse(quranData);
      
      const userRef = firestore().collection('users').doc(userId);
      await userRef.set(
        {
          quranProgress: progress,
          lastSynced: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      Logger.info('Quran progress synced to cloud');
    } catch (error) {
      Logger.error('Error syncing Quran progress', error);
      throw error;
    }
  }

  /**
   * Sync settings
   */
  async syncSettings(userId: string): Promise<void> {
    try {
      const settingsData = await AsyncStorage.getItem('@salah:settings');
      if (!settingsData) return;

      const settings = JSON.parse(settingsData);
      
      const userRef = firestore().collection('users').doc(userId);
      await userRef.set(
        {
          settings,
          lastSynced: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      Logger.info('Settings synced to cloud');
    } catch (error) {
      Logger.error('Error syncing settings', error);
      throw error;
    }
  }

  /**
   * Restore from cloud
   */
  async restoreFromCloud(userId: string): Promise<void> {
    try {
      Logger.info('Restoring data from cloud');
      
      const userRef = firestore().collection('users').doc(userId);
      const doc = await userRef.get();

      if (!doc.exists) {
        Logger.warn('No cloud data found');
        return;
      }

      const data = doc.data();
      if (!data) return;

      // Restore prayers with conflict resolution
      if (data.prayerProgress) {
        await this.restorePrayers(data.prayerProgress);
      }

      // Restore Quran progress
      if (data.quranProgress) {
        await AsyncStorage.setItem(
          '@salah:quranProgress',
          JSON.stringify(data.quranProgress)
        );
      }

      // Restore settings
      if (data.settings) {
        await AsyncStorage.setItem(
          '@salah:settings',
          JSON.stringify(data.settings)
        );
      }

      Logger.info('Data restored from cloud');
    } catch (error) {
      Logger.error('Error restoring from cloud', error);
      throw error;
    }
  }

  /**
   * Restore prayers with conflict resolution (merge strategy)
   */
  private async restorePrayers(cloudProgress: Record<string, PrayerProgress>): Promise<void> {
    try {
      const localData = await AsyncStorage.getItem('@salah:prayerProgress');
      const localProgress = localData ? JSON.parse(localData) : {};

      // Merge strategy: keep most recent data for each day
      const merged: Record<string, PrayerProgress> = { ...cloudProgress };

      Object.entries(localProgress).forEach(([date, progress]) => {
        const cloudDay = cloudProgress[date];
        if (!cloudDay) {
          // Local has data cloud doesn't - keep local
          merged[date] = progress as PrayerProgress;
        } else {
          // Both have data - keep the one with more completed prayers
          const localCompleted = Object.values((progress as PrayerProgress).prayers).filter(
            (p) => p
          ).length;
          const cloudCompleted = Object.values(cloudDay.prayers).filter((p) => p).length;

          if (localCompleted > cloudCompleted) {
            merged[date] = progress as PrayerProgress;
          }
        }
      });

      await AsyncStorage.setItem('@salah:prayerProgress', JSON.stringify(merged));
    } catch (error) {
      Logger.error('Error restoring prayers', error);
      throw error;
    }
  }

  /**
   * Create backup data structure
   */
  async createBackup(): Promise<BackupData> {
    try {
      const prayers = await AsyncStorage.getItem('@salah:prayerProgress');
      const quran = await AsyncStorage.getItem('@salah:quranProgress');
      const settings = await AsyncStorage.getItem('@salah:settings');

      return {
        prayers: prayers ? JSON.parse(prayers) : {},
        quran: quran ? JSON.parse(quran) : {},
        settings: settings ? JSON.parse(settings) : {},
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      Logger.error('Error creating backup', error);
      throw error;
    }
  }

  /**
   * Restore from backup data
   */
  async restoreFromBackup(backup: BackupData): Promise<void> {
    try {
      if (backup.prayers) {
        await AsyncStorage.setItem('@salah:prayerProgress', JSON.stringify(backup.prayers));
      }
      if (backup.quran) {
        await AsyncStorage.setItem('@salah:quranProgress', JSON.stringify(backup.quran));
      }
      if (backup.settings) {
        await AsyncStorage.setItem('@salah:settings', JSON.stringify(backup.settings));
      }

      Logger.info('Data restored from backup');
    } catch (error) {
      Logger.error('Error restoring from backup', error);
      throw error;
    }
  }
}

export default CloudSyncService.getInstance();

