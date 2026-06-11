import type { OwnerProfile, PetProfile } from '@/contexts/user-context';
import { haversineKm, NEARBY_ALERT_RADIUS_KM, type Coordinates } from '@/lib/geo';
import {
  invokeLostPetPushEdgeFunction,
  sendLostPetPushNotifications,
  type LostPetPushMessage,
} from '@/lib/push/expo-push';
import { getSupabase } from '@/lib/supabase/client';
import type { AlertNotificationRow } from '@/lib/supabase/types';

export type { AlertNotificationRow };

export async function fetchAlertNotifications(recipientEmail: string): Promise<AlertNotificationRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('alert_notifications')
    .select('*')
    .eq('recipient_email', recipientEmail.trim().toLowerCase())
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function markAlertNotificationRead(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('alert_notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllAlertNotificationsRead(recipientEmail: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('alert_notifications')
    .update({ read: true })
    .eq('recipient_email', recipientEmail.trim().toLowerCase());

  if (error) throw error;
}

type SubscriberRow = {
  email: string;
  latitude: number | null;
  longitude: number | null;
  alerts_enabled: boolean;
  push_token: string | null;
};

/** Notify nearby app users when a pet is marked lost. */
export async function broadcastLostPetAlert(input: {
  reporterEmail: string;
  pet: PetProfile;
  lostLocation: Coordinates;
}): Promise<{ notified: number; pushSent: number }> {
  const supabase = getSupabase();
  const reporterKey = input.reporterEmail.trim().toLowerCase();

  const { data: subscribers, error } = await supabase
    .from('owners')
    .select('email, latitude, longitude, alerts_enabled, push_token')
    .eq('alerts_enabled', true)
    .neq('email', reporterKey);

  if (error) throw error;

  const inserts: Omit<AlertNotificationRow, 'id' | 'created_at' | 'read'>[] = [];
  const pushMessages: LostPetPushMessage[] = [];

  for (const row of (subscribers ?? []) as SubscriberRow[]) {
    if (row.latitude == null || row.longitude == null) continue;

    const distanceKm = haversineKm(
      { latitude: row.latitude, longitude: row.longitude },
      input.lostLocation,
    );

    if (distanceKm > NEARBY_ALERT_RADIUS_KM) continue;

    const roundedDistance = Math.round(distanceKm * 10) / 10;

    inserts.push({
      recipient_email: row.email,
      pet_qr_code_id: input.pet.qrCodeId,
      pet_name: input.pet.name,
      distance_km: roundedDistance,
    });

    if (row.push_token) {
      pushMessages.push({
        pushToken: row.push_token,
        petName: input.pet.name,
        distanceKm: roundedDistance,
        petQrCodeId: input.pet.qrCodeId,
      });
    }
  }

  if (inserts.length === 0) return { notified: 0, pushSent: 0 };

  const { error: insertError } = await supabase.from('alert_notifications').insert(inserts);
  if (insertError) throw insertError;

  let pushSent = 0;
  if (pushMessages.length > 0) {
    try {
      pushSent = await sendLostPetPushNotifications(pushMessages);
    } catch (clientError) {
      console.warn('Client Expo push failed, trying edge function', clientError);
      const edgeOk = await invokeLostPetPushEdgeFunction(pushMessages);
      if (edgeOk) {
        pushSent = pushMessages.length;
      }
    }
  }

  return { notified: inserts.length, pushSent };
}

export async function deleteAlertNotificationsForOwner(email: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('alert_notifications')
    .delete()
    .eq('recipient_email', email.trim().toLowerCase());

  if (error) throw error;
}

export function alertRowToLostMeta(row: AlertNotificationRow, owner: OwnerProfile, pet: PetProfile) {
  return {
    distanceKm: row.distance_km,
    reportedAt: row.created_at,
    lastSeenLocation: `${owner.address}, ${owner.city}`,
    pet,
    owner,
  };
}
