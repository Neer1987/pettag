import type { PetProfile } from '@/contexts/user-context';
import { getSupabase } from '@/lib/supabase/client';
import { ownerRowToProfile, petProfileToRow, petRowToProfile } from '@/lib/supabase/mappers';
import { updateOwnerActivePet } from '@/lib/supabase/owners';

export async function fetchPetsByOwnerId(ownerId: string): Promise<PetProfile[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(petRowToProfile);
}

function ownerLastSeenLabel(address?: string, city?: string) {
  if (address && city) return `${address}, ${city}`;
  return address ?? city ?? null;
}

export async function upsertPet(
  ownerId: string,
  pet: PetProfile,
  ownerAddress?: string,
  ownerCity?: string,
) {
  const supabase = getSupabase();
  const lastSeen = pet.isLost ? ownerLastSeenLabel(ownerAddress, ownerCity) : null;
  const row = petProfileToRow(ownerId, pet, lastSeen);

  const { error } = await supabase.from('pets').upsert(row, { onConflict: 'qr_code_id' });
  if (error) throw error;
}

export async function upsertPets(
  ownerId: string,
  pets: PetProfile[],
  ownerAddress?: string,
  ownerCity?: string,
) {
  for (const pet of pets) {
    await upsertPet(ownerId, pet, ownerAddress, ownerCity);
  }
}

export async function fetchPublicProfileByQrCode(qrCodeId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('pets')
    .select('*, owners(*)')
    .eq('qr_code_id', qrCodeId.trim().toLowerCase())
    .maybeSingle();

  if (error) throw error;
  if (!data?.owners) return null;

  const ownerRow = Array.isArray(data.owners) ? data.owners[0] : data.owners;
  if (!ownerRow) return null;

  return {
    owner: ownerRowToProfile(ownerRow),
    pet: petRowToProfile(data),
  };
}

export async function isQrCodeIdTaken(qrCodeId: string, excludeQrCodeId?: string): Promise<boolean> {
  const supabase = getSupabase();
  const normalized = qrCodeId.trim().toLowerCase();
  const { data, error } = await supabase
    .from('pets')
    .select('qr_code_id')
    .eq('qr_code_id', normalized)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;
  if (excludeQrCodeId && data.qr_code_id === excludeQrCodeId.trim().toLowerCase()) {
    return false;
  }
  return true;
}

export async function updatePetQrCodeId(
  ownerId: string,
  ownerEmail: string,
  oldQrCodeId: string,
  newQrCodeId: string,
): Promise<void> {
  const supabase = getSupabase();
  const previous = oldQrCodeId.trim().toLowerCase();
  const next = newQrCodeId.trim().toLowerCase();

  if (previous === next) return;

  const taken = await isQrCodeIdTaken(next, previous);
  if (taken) {
    throw new Error('This QR code is already linked to another pet.');
  }

  const { data: updatedRows, error } = await supabase
    .from('pets')
    .update({ qr_code_id: next })
    .eq('owner_id', ownerId)
    .eq('qr_code_id', previous)
    .select('qr_code_id');

  if (error) throw error;
  if (!updatedRows?.length) {
    throw new Error('Could not update this pet’s QR code.');
  }

  const { data: ownerRow, error: ownerError } = await supabase
    .from('owners')
    .select('active_pet_qr_code_id')
    .eq('id', ownerId)
    .maybeSingle();

  if (ownerError) throw ownerError;

  if (ownerRow?.active_pet_qr_code_id === previous) {
    await updateOwnerActivePet(ownerEmail, next);
  }
}

export async function fetchLostPets() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('pets')
    .select('*, owners(*)')
    .eq('is_lost', true)
    .order('lost_at', { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const ownerRow = Array.isArray(row.owners) ? row.owners[0] : row.owners;
      if (!ownerRow) return null;
      return {
        owner: ownerRowToProfile(ownerRow),
        pet: petRowToProfile(row),
        lostAt: row.lost_at,
        lastSeenLocation: row.last_seen_location,
        lostLatitude: row.lost_latitude,
        lostLongitude: row.lost_longitude,
        ownerLatitude: ownerRow.latitude,
        ownerLongitude: ownerRow.longitude,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}
