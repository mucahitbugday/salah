declare module 'react-native-push-notification' {
  interface PushNotification {
    localNotificationSchedule(options: {
      id?: string;
      title: string;
      message: string;
      date: Date;
      allowWhileIdle?: boolean;
      channelId?: string;
      soundName?: string;
      vibrate?: boolean;
      userInfo?: Record<string, unknown>;
    }): void;

    localNotification(options: {
      title: string;
      message: string;
      channelId?: string;
    }): void;

    cancelLocalNotifications(options?: { id?: string }): void;
    cancelAllLocalNotifications(): void;

    createChannel(
      channel: {
        channelId: string;
        channelName: string;
        channelDescription: string;
        playSound?: boolean;
        soundName?: string;
        importance?: number;
        vibrate?: boolean;
      },
      callback: (created: boolean) => void
    ): void;

    configure(options: {
      onRegister?: (token: { token: string }) => void;
      onNotification?: (notification: PushNotification) => void;
      onAction?: (notification: PushNotification) => void;
      onRegistrationError?: (err: Error) => void;
      permissions?: {
        alert: boolean;
        badge: boolean;
        sound: boolean;
      };
      popInitialNotification?: boolean;
      requestPermissions?: boolean;
    }): void;
  }

  const PushNotification: PushNotification;
  export default PushNotification;
}

