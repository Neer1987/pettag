import type { OwnerProfile } from '@/contexts/user-context';
import type { Coordinates } from '@/lib/geo';
import { getSupabase } from '@/lib/supabase/client';
import { ownerProfileToRow, ownerRowToProfile } from '@/lib/supabase/mappers';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function fetchOwnerByEmail(email: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('owners')
    .select('*')
    .eq('email', normalizeEmail(email))
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function isOwnerRegistered(email: string): Promise<boolean> {
  const owner = await fetchOwnerByEmail(email);
  return Boolean(owner);
}

export async function isOwnerEmailVerified(email: string): Promise<boolean> {
  const owner = await fetchOwnerByEmail(email);
  return Boolean(owner?.email_verified);
}

export async function upsertOwner(
  owner: OwnerProfile,
  activePetQrCodeId: string | null,
  emailVerified: boolean,
): Promise<string> {
  const supabase = getSupabase();
  const row = ownerProfileToRow(owner, activePetQrCodeId, emailVerified);

  const { data, error } = await supabase
    .from('owners')
    .upsert(row, { onConflict: 'email' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function markOwnerEmailVerified(email: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('owners')
    .update({ email_verified: true })
    .eq('email', normalizeEmail(email));

  if (error) throw error;
}

export async function updateOwnerActivePet(email: string, activePetQrCodeId: string | null) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('owners')
    .update({ active_pet_qr_code_id: activePetQrCodeId })
    .eq('email', normalizeEmail(email));

  if (error) throw error;
}

export async function loadOwnerProfile(email: string): Promise<{
  owner: OwnerProfile;
  ownerId: string;
  activePetQrCodeId: string | null;
  emailVerified: boolean;
  alertsEnabled: boolean;
  latitude: number | null;
  longitude: number | null;
} | null> {
  const row = await fetchOwnerByEmail(email);
  if (!row) return null;

  return {
    owner: ownerRowToProfile(row),
    ownerId: row.id,
    activePetQrCodeId: row.active_pet_qr_code_id,
    emailVerified: row.email_verified,
    alertsEnabled: row.alerts_enabled ?? true,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export async function updateOwnerLocation(email: string, coords: Coordinates) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('owners')
    .update({
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_updated_at: new Date().toISOString(),
    })
    .eq('email', normalizeEmail(email));

  if (error) throw error;
}

export async function updateOwnerPushToken(email: string, pushToken: string | null) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('owners')
    .update({ push_token: pushToken })
    .eq('email', normalizeEmail(email));

  if (error) throw error;
}

export async function updateOwnerAlertsEnabled(email: string, enabled: boolean) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('owners')
    .update({ alerts_enabled: enabled })
    .eq('email', normalizeEmail(email));

  if (error) throw error;
}
