import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const LOST_PET_AMBER_CHANNEL = 'lost-pet-amber';
export const INBOX_MESSAGES_CHANNEL = 'inbox-messages';
/** @deprecated Use INBOX_MESSAGES_CHANNEL */
export const PET_FOUND_CHANNEL = INBOX_MESSAGES_CHANNEL;

/** Bundled via expo-notifications plugin — use base filename only. */
export const LOST_PET_ALERT_SOUND = 'lost_pet_alert.wav';
export const INBOX_MESSAGE_SOUND = 'inbox_message.wav';

const SOUND_ENABLED_TYPES = new Set([
  'lost_pet',
  'lost_pet_amber',
  'pet_found',
  'inbox_reply',
  'inbox_message',
]);

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const type = notification.request.content.data?.type;
    const isLostPet = type === 'lost_pet' || type === 'lost_pet_amber';
    const shouldPlaySound =
      Boolean(notification.request.content.sound) ||
      !type ||
      SOUND_ENABLED_TYPES.has(String(type));

    return {
      shouldShowAlert: true,
      shouldPlaySound,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: isLostPet
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

async function recreateAndroidChannel(
  channelId: string,
  channel: Notifications.NotificationChannelInput,
) {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.deleteNotificationChannelAsync(channelId);
  } catch {
    // Channel may not exist on first launch.
  }

  await Notifications.setNotificationChannelAsync(channelId, channel);
}

export async function setupNotificationChannels() {
  if (Platform.OS !== 'android') return;

  await recreateAndroidChannel(LOST_PET_AMBER_CHANNEL, {
    name: 'Lost pet alerts',
    description: 'Urgent alerts when a pet is reported missing nearby',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 800, 400, 800, 400, 800],
    enableVibrate: true,
    lightColor: '#C0392B',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    sound: LOST_PET_ALERT_SOUND,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
  });

  await recreateAndroidChannel(INBOX_MESSAGES_CHANNEL, {
    name: 'Messages & inbox',
    description: 'New messages, replies, and pet found reports',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 120, 250],
    enableVibrate: true,
    sound: INBOX_MESSAGE_SOUND,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.NOTIFICATION,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
  });

  for (const legacyChannel of ['lost-pet-alerts', 'pet-found']) {
    try {
      await Notifications.deleteNotificationChannelAsync(legacyChannel);
    } catch {
      // Ignore missing legacy channels.
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  await setupNotificationChannels();

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === Notifications.PermissionStatus.GRANTED) {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return status === Notifications.PermissionStatus.GRANTED;
}

/** Call once at app startup so Android channels exist before any notification is shown. */
export async function ensureNotificationsReady(): Promise<boolean> {
  return requestNotificationPermission();
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const token = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return token.data;
  } catch (error) {
    console.warn('Unable to register Expo push token', error);
    return null;
  }
}

/** Urgent local notification — amber-alert style for lost pets nearby. */
export async function showLostPetAmberNotification(input: {
  petName: string;
  distanceKm: number;
  petQrCodeId: string;
}) {
  const distanceLabel =
    input.distanceKm < 1
      ? `${Math.round(input.distanceKm * 10) / 10} km away`
      : `${input.distanceKm.toFixed(1)} km away`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🚨 LOST PET ALERT — ${input.petName}`,
      body: `${input.petName} is missing ${distanceLabel}. Tap to view alert and help reunite.`,
      subtitle: 'Amber Alert · PetTag',
      data: { petQrCodeId: input.petQrCodeId, type: 'lost_pet_amber' },
      sound: LOST_PET_ALERT_SOUND,
      priority: Notifications.AndroidNotificationPriority.MAX,
      sticky: Platform.OS === 'android',
      ...(Platform.OS === 'ios' ? { interruptionLevel: 'timeSensitive' as const } : null),
    },
    trigger: null,
    ...(Platform.OS === 'android' ? { channelId: LOST_PET_AMBER_CHANNEL } : {}),
  });
}

export async function showLostPetNotification(input: {
  petName: string;
  distanceKm: number;
  petQrCodeId: string;
}) {
  await showLostPetAmberNotification(input);
}

export async function showPetFoundNotification(input: {
  petName: string;
  senderName: string;
  body: string;
  petQrCodeId: string;
  kind?: 'pet_found' | 'inbox_reply' | 'inbox_message';
}) {
  await showInboxMessageNotification(input);
}

export async function showInboxMessageNotification(input: {
  petName: string;
  senderName: string;
  body: string;
  petQrCodeId: string;
  kind?: 'pet_found' | 'inbox_reply' | 'inbox_message';
}) {
  const preview = input.body.length > 90 ? `${input.body.slice(0, 90)}…` : input.body;
  const kind = input.kind ?? 'inbox_message';

  const title =
    kind === 'pet_found'
      ? `🎉 ${input.petName} may have been found!`
      : kind === 'inbox_reply'
        ? `💬 Reply about ${input.petName}`
        : `💬 New message about ${input.petName}`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: `${input.senderName}: ${preview}`,
      data: { petQrCodeId: input.petQrCodeId, type: kind },
      sound: INBOX_MESSAGE_SOUND,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'ios' ? { interruptionLevel: 'active' as const } : null),
    },
    trigger: null,
    ...(Platform.OS === 'android' ? { channelId: INBOX_MESSAGES_CHANNEL } : {}),
  });
}

export async function setBadgeCount(count: number) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Badge not supported on all platforms
  }
}
