import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

type NotificationData = {
  type?: string;
  petQrCodeId?: string;
};

function openFromNotification(data: NotificationData | undefined) {
  if (!data?.type) return;

  if (data.type === 'lost_pet' || data.type === 'lost_pet_amber') {
    if (data.petQrCodeId) {
      router.push(`/pet/${data.petQrCodeId}`);
      return;
    }
    router.push('/(tabs)/alerts');
    return;
  }

  if (
    data.type === 'pet_found' ||
    data.type === 'inbox_reply' ||
    data.type === 'inbox_message'
  ) {
    router.push('/(tabs)/inbox');
  }
}

/** Deep-link notification taps to Alerts or Inbox (including cold start). */
export function NotificationRouter() {
  useEffect(() => {
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      openFromNotification(response?.notification.request.content.data as NotificationData);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromNotification(response.notification.request.content.data as NotificationData);
    });

    return () => subscription.remove();
  }, []);

  return null;
}
