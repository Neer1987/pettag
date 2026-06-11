import type { OwnerProfile, PetMediaItem, PetProfile, PublicProfile, OwnerRow, PetRow } from '@/lib/types';
import { getSupabase } from '@/lib/supabase';

function normalizeMedia(raw: PetRow['media']): PetMediaItem[] {
  if (!raw) return [];

  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.filter(
    (item): item is PetMediaItem =>
      Boolean(item) &&
      typeof item === 'object' &&
      typeof (item as PetMediaItem).uri === 'string' &&
      ((item as PetMediaItem).type === 'photo' || (item as PetMediaItem).type === 'video'),
  );
}

function ownerRowToProfile(row: OwnerRow): OwnerProfile {
  return {
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
  };
}

function petRowToProfile(row: PetRow): PetProfile {
  return {
    name: row.name,
    species: row.species,
    gender: row.gender,
    coat: row.coat,
    breed: row.breed,
    age: row.age,
    weight: row.weight,
    markings: row.markings ?? [],
    microchip: row.microchip,
    notes: row.notes,
    coverPhotoUri: row.cover_photo_uri || null,
    media: normalizeMedia(row.media),
    qrCodeId: row.qr_code_id,
    profileSlug: row.profile_slug,
    qrDesignId: row.qr_design_id,
    isLost: row.is_lost,
  };
}

export async function fetchPublicProfileByQrCode(qrCodeId: string): Promise<PublicProfile | null> {
  const supabase = getSupabase();
  const normalized = qrCodeId.trim().toLowerCase();
  const { data, error } = await supabase
    .from('pets')
    .select('*, owners(*)')
    .or(`qr_code_id.eq.${normalized},profile_slug.eq.${normalized}`)
    .maybeSingle();

  if (error) throw error;
  if (!data?.owners) return null;

  const ownerRow = (Array.isArray(data.owners) ? data.owners[0] : data.owners) as OwnerRow | undefined;
  if (!ownerRow) return null;

  return {
    owner: ownerRowToProfile(ownerRow),
    pet: petRowToProfile(data as PetRow),
  };
}

async function notifyOwnerPush(input: {
  recipientEmail: string;
  petName: string;
  petQrCodeId: string;
  senderName: string;
  body: string;
  kind: 'pet_found' | 'inbox_message';
}) {
  const token = import.meta.env.VITE_EXPO_ACCESS_TOKEN;
  if (!token) return;

  const supabase = getSupabase();
  const { data: owner } = await supabase
    .from('owners')
    .select('push_token')
    .eq('email', input.recipientEmail.trim().toLowerCase())
    .maybeSingle();

  const pushToken = owner?.push_token;
  if (!pushToken?.startsWith('ExponentPushToken[')) return;

  const preview = input.body.length > 90 ? `${input.body.slice(0, 90)}…` : input.body;
  const title =
    input.kind === 'pet_found'
      ? `🎉 ${input.petName} may have been found!`
      : `💬 New message about ${input.petName}`;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify([
      {
        to: pushToken,
        title,
        body: `${input.senderName}: ${preview}`,
        data: { type: input.kind, petQrCodeId: input.petQrCodeId, petName: input.petName },
        sound: 'inbox_message.wav',
        priority: 'high',
        channelId: 'inbox-messages',
      },
    ]),
  });
}

export async function sendFinderMessage(input: {
  recipientEmail: string;
  petName: string;
  petSlug: string;
  senderName: string;
  senderEmail: string;
  body: string;
  isFoundPet?: boolean;
}): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from('messages').insert({
    recipient_email: input.recipientEmail.trim().toLowerCase(),
    pet_qr_code_id: input.petSlug,
    pet_name: input.petName,
    sender_name: input.senderName.trim(),
    sender_email: input.senderEmail.trim(),
    body: input.body.trim(),
  });

  if (error) throw error;

  try {
    await notifyOwnerPush({
      recipientEmail: input.recipientEmail,
      petName: input.petName,
      petQrCodeId: input.petSlug,
      senderName: input.senderName,
      body: input.body,
      kind: input.isFoundPet ? 'pet_found' : 'inbox_message',
    });
  } catch {
    // Push is best-effort; message is saved regardless.
  }
}
