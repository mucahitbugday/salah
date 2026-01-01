import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';
import i18n from '../i18n';

export type PermissionType = 'location' | 'notification';

const getPermission = (type: PermissionType): Permission => {
  if (type === 'location') {
    return Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  }
  // Notification permissions are handled differently
  return Platform.OS === 'ios'
    ? PERMISSIONS.IOS.NOTIFICATIONS
    : PERMISSIONS.ANDROID.POST_NOTIFICATIONS;
};

export const checkPermission = async (type: PermissionType): Promise<boolean> => {
  try {
    if (type === 'notification' && Platform.OS === 'android') {
      // Android notification permission handling
      if (Platform.Version >= 33) {
        const result = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        return result === RESULTS.GRANTED;
      }
      return true; // Android < 33 doesn't require runtime permission
    }
    
    const permission = getPermission(type);
    const result = await check(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error(`Error checking ${type} permission:`, error);
    return false;
  }
};

export const requestPermission = async (type: PermissionType): Promise<boolean> => {
  try {
    if (type === 'notification' && Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        return result === RESULTS.GRANTED;
      }
      return true;
    }
    
    const permission = getPermission(type);
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error(`Error requesting ${type} permission:`, error);
    return false;
  }
};

export const requestPermissionWithAlert = async (
  type: PermissionType,
  onGranted?: () => void,
  onDenied?: () => void
): Promise<void> => {
  const isGranted = await checkPermission(type);
  
  if (isGranted) {
    onGranted?.();
    return;
  }
  
  const titleKey = type === 'location' ? 'permissions.locationTitle' : 'permissions.notificationTitle';
  const messageKey = type === 'location' ? 'permissions.locationMessage' : 'permissions.notificationMessage';
  
  Alert.alert(
    i18n.t(titleKey),
    i18n.t(messageKey),
    [
      {
        text: i18n.t('permissions.deny'),
        style: 'cancel',
        onPress: onDenied,
      },
      {
        text: i18n.t('permissions.grant'),
        onPress: async () => {
          const granted = await requestPermission(type);
          if (granted) {
            onGranted?.();
          } else {
            onDenied?.();
          }
        },
      },
    ]
  );
};

