import type { OwnerProfile, PetProfile } from '@/contexts/user-context';
import type { OwnerRow, PetRow } from '@/lib/supabase/types';
import type { PetMediaItem } from '@/lib/pet-media';

function normalizeMedia(raw: PetRow['media'] | string | null | undefined): PetMediaItem[] {
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

export function ownerRowToProfile(row: OwnerRow): OwnerProfile {
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

export function ownerProfileToRow(
  owner: OwnerProfile,
  activePetQrCodeId: string | null,
  emailVerified: boolean,
): Omit<OwnerRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    email: owner.email.trim().toLowerCase(),
    full_name: owner.fullName,
    phone: owner.phone,
    address: owner.address,
    city: owner.city,
    state: owner.state,
    zip: owner.zip,
    email_verified: emailVerified,
    active_pet_qr_code_id: activePetQrCodeId,
  };
}

export function petRowToProfile(row: PetRow): PetProfile {
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
    lostLatitude: row.lost_latitude,
    lostLongitude: row.lost_longitude,
  };
}

export function petProfileToRow(
  ownerId: string,
  pet: PetProfile,
  lastSeenLocation?: string | null,
): Omit<PetRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    owner_id: ownerId,
    qr_code_id: pet.qrCodeId,
    profile_slug: pet.profileSlug,
    name: pet.name,
    species: pet.species,
    gender: pet.gender,
    coat: pet.coat,
    breed: pet.breed,
    age: pet.age,
    weight: pet.weight,
    markings: pet.markings,
    microchip: pet.microchip,
    notes: pet.notes,
    cover_photo_uri: pet.coverPhotoUri,
    media: pet.media,
    qr_design_id: pet.qrDesignId,
    is_lost: pet.isLost,
    lost_at: pet.isLost ? new Date().toISOString() : null,
    last_seen_location: pet.isLost ? (lastSeenLocation ?? null) : null,
    lost_latitude: pet.isLost ? (pet.lostLatitude ?? null) : null,
    lost_longitude: pet.isLost ? (pet.lostLongitude ?? null) : null,
  };
}
