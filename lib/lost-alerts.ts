import type { OwnerProfile, PetProfile } from '@/contexts/user-context';
import { displayWeight } from '@/lib/weight-format';

export type LostPetAlert = {
  id: string;
  profileSlug: string;
  petName: string;
  species: string;
  breed: string;
  gender: string;
  coat: string;
  weight: string;
  age: string;
  markings: string[];
  coverPhotoUri: string | null;
  photoUris: string[];
  lastSeenLocation: string;
  distanceKm: number;
  reportedAt: string;
  ownerName: string;
  ownerEmail: string;
  notes: string;
};

export function formatAlertDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 10) / 10} km from you`;
  return `${km.toFixed(1)} km from you`;
}

export function formatReportedAt(iso: string | null | undefined): string {
  if (!iso) return 'Recently';

  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function profileToLostAlert(
  owner: OwnerProfile,
  pet: PetProfile,
  meta?: Partial<Pick<LostPetAlert, 'lastSeenLocation' | 'distanceKm' | 'reportedAt'>>,
): LostPetAlert {
  const photoUris = pet.media.filter((m) => m.type === 'photo').map((m) => m.uri);
  const cover = pet.coverPhotoUri;
  const gallery =
    cover && !photoUris.includes(cover)
      ? [cover, ...photoUris]
      : photoUris.length
        ? photoUris
        : cover
          ? [cover]
          : [];

  return {
    id: pet.qrCodeId,
    profileSlug: pet.qrCodeId,
    petName: pet.name,
    species: pet.species,
    breed: pet.breed,
    gender: pet.gender,
    coat: pet.coat,
    weight: displayWeight(pet.weight),
    age: pet.age,
    markings: pet.markings,
    coverPhotoUri: cover,
    photoUris: gallery,
    lastSeenLocation: meta?.lastSeenLocation ?? `${owner.address}, ${owner.city}`,
    distanceKm: meta?.distanceKm ?? 0.8,
    reportedAt: meta?.reportedAt ?? 'Recently',
    ownerName: owner.fullName,
    ownerEmail: owner.email,
    notes: pet.notes,
  };
}

export function sortLostAlerts(alerts: LostPetAlert[]): LostPetAlert[] {
  return [...alerts].sort((a, b) => a.distanceKm - b.distanceKm);
}
