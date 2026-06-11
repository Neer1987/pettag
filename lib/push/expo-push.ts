import {
  INBOX_MESSAGES_CHANNEL,
  INBOX_MESSAGE_SOUND,
  LOST_PET_ALERT_SOUND,
  LOST_PET_AMBER_CHANNEL,
} from '@/lib/notifications';
import { getErrorMessage } from '@/lib/errors';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function pushFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Network connection failed. Check your internet and try again.'));
  }
}

export type LostPetPushMessage = {
  pushToken: string;
  petName: string;
  distanceKm: number;
  petQrCodeId: string;
};

export type PetFoundPushMessage = {
  pushToken: string;
  petName: string;
  petQrCodeId: string;
  senderName: string;
  body: string;
};

export type InboxPushKind = 'pet_found' | 'inbox_reply' | 'inbox_message';

export type InboxPushMessage = PetFoundPushMessage & {
  kind?: InboxPushKind;
};

type ExpoPushPayload = {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
  sound: string;
  priority: 'high' | 'default';
  channelId?: string;
};

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 10) / 10} km away` : `${km.toFixed(1)} km away`;
}

function toExpoPayload(message: LostPetPushMessage): ExpoPushPayload {
  const distanceLabel = formatDistance(message.distanceKm);

  return {
    to: message.pushToken,
    title: `🚨 LOST PET ALERT — ${message.petName}`,
    body: `${message.petName} is missing ${distanceLabel}. Tap to view alert and help reunite.`,
    data: {
      type: 'lost_pet_amber',
      petQrCodeId: message.petQrCodeId,
      petName: message.petName,
    },
    sound: LOST_PET_ALERT_SOUND,
    priority: 'high',
    channelId: LOST_PET_AMBER_CHANNEL,
  };
}

function toInboxPayload(message: InboxPushMessage): ExpoPushPayload {
  const preview =
    message.body.length > 90 ? `${message.body.slice(0, 90)}…` : message.body;
  const kind = message.kind ?? 'inbox_message';

  const title =
    kind === 'pet_found'
      ? `🎉 ${message.petName} may have been found!`
      : kind === 'inbox_reply'
        ? `💬 Reply about ${message.petName}`
        : `💬 New message about ${message.petName}`;

  return {
    to: message.pushToken,
    title,
    body: `${message.senderName}: ${preview}`,
    data: {
      type: kind,
      petQrCodeId: message.petQrCodeId,
      petName: message.petName,
    },
    sound: INBOX_MESSAGE_SOUND,
    priority: 'high',
    channelId: INBOX_MESSAGES_CHANNEL,
  };
}

/** Send push notifications via Expo Push API (works when recipient app is closed). */
export async function sendLostPetPushNotifications(messages: LostPetPushMessage[]): Promise<number> {
  const tokens = messages.filter((m) => m.pushToken.startsWith('ExponentPushToken['));
  if (tokens.length === 0) return 0;

  const accessToken = process.env.EXPO_PUBLIC_EXPO_ACCESS_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let sent = 0;
  const batchSize = 100;

  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize).map(toExpoPayload);
    const response = await pushFetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Expo push failed (${response.status}): ${text}`);
    }

    const result = (await response.json()) as { data?: { status?: string }[] };
    sent += result.data?.filter((item) => item.status === 'ok').length ?? batch.length;
  }

  return sent;
}

export async function sendInboxPushNotification(message: InboxPushMessage): Promise<boolean> {
  if (!message.pushToken.startsWith('ExponentPushToken[')) return false;

  const accessToken = process.env.EXPO_PUBLIC_EXPO_ACCESS_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await pushFetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify([toInboxPayload(message)]),
  });

  if (!response.ok) {
    const text = await response.text();
    console.warn(`Inbox push failed (${response.status}): ${text}`);
    return false;
  }

  return true;
}

/** @deprecated Use sendInboxPushNotification */
export async function sendPetFoundPushNotification(message: PetFoundPushMessage): Promise<boolean> {
  return sendInboxPushNotification({ ...message, kind: 'pet_found' });
}

export async function invokeLostPetPushEdgeFunction(messages: LostPetPushMessage[]): Promise<boolean> {
  try {
    const { getSupabase } = await import('@/lib/supabase/client');
    const supabase = getSupabase();
    const { error } = await supabase.functions.invoke('send-lost-pet-push', {
      body: { messages },
    });
    return !error;
  } catch {
    return false;
  }
}
