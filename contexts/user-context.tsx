import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_QR_DESIGN_ID } from '@/constants/qr-templates';
import { createMediaItem, slugifyPetName, type PetMediaItem } from '@/lib/pet-media';
import { createQrCodeId } from '@/lib/pet-url';
import { clearSessionEmail, loadSessionEmail, saveSessionEmail } from '@/lib/session-cache';
import {
  loadOwnerProfile,
  markOwnerEmailVerified,
  updateOwnerActivePet,
  upsertOwner,
} from '@/lib/supabase/owners';
import { broadcastLostPetAlert } from '@/lib/supabase/alerts';
import { getMissingSchemaMessage, isMissingSchemaError } from '@/lib/supabase/errors';
import { fetchPetsByOwnerId, updatePetQrCodeId, upsertPet, upsertPets } from '@/lib/supabase/pets';
import { getQrCodeIdValidationError, normalizeQrCodeInput, parseQrCodeIdFromInput } from '@/lib/qr-code-id';
import { getErrorMessage, logAppError } from '@/lib/errors';
import { deleteAccountByEmail } from '@/lib/supabase/account';
import { uploadLocalMediaUri, uploadPetProfileMedia, uploadPetsMedia } from '@/lib/supabase/storage';
import { isSupabaseConfigured, getSupabaseNetworkErrorMessage, getSupabaseReachabilityHint } from '@/lib/supabase/client';
import { getCurrentCoordinates } from '@/lib/location';
import { updateOwnerLocation } from '@/lib/supabase/owners';

export type OwnerProfile = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
};

export type PetProfile = {
  name: string;
  species: string;
  gender: string;
  coat: string;
  breed: string;
  age: string;
  weight: string;
  markings: string[];
  microchip: string;
  notes: string;
  coverPhotoUri: string | null;
  media: PetMediaItem[];
  qrCodeId: string;
  profileSlug: string;
  qrDesignId: string;
  isLost: boolean;
  lostLatitude?: number | null;
  lostLongitude?: number | null;
};

type UserContextValue = {
  owner: OwnerProfile | null;
  pets: PetProfile[];
  pet: PetProfile | null;
  activePetQrCodeId: string | null;
  hydrated: boolean;
  setOwner: (owner: OwnerProfile) => void;
  selectPet: (qrCodeId: string) => void;
  isLoggedIn: boolean;
  registerUser: (
    owner: OwnerProfile,
    pet: Omit<PetProfile, 'media' | 'profileSlug' | 'qrCodeId' | 'qrDesignId' | 'isLost'> & {
      coverPhotoUri?: string | null;
      qrDesignId?: string;
    },
  ) => Promise<void>;
  addPet: (
    pet: Omit<PetProfile, 'media' | 'profileSlug' | 'qrCodeId' | 'qrDesignId' | 'isLost'> & {
      coverPhotoUri?: string | null;
      qrDesignId?: string;
    },
  ) => Promise<void>;
  updatePetProfile: (
    pet: Omit<PetProfile, 'media' | 'profileSlug' | 'qrCodeId' | 'qrDesignId' | 'isLost'> & {
      coverPhotoUri?: string | null;
    },
  ) => Promise<void>;
  loginWithEmail: (email: string) => Promise<boolean>;
  addPetMedia: (uri: string, caption?: string) => Promise<boolean>;
  updatePetMediaCaption: (mediaId: string, caption: string) => void;
  removePetMedia: (id: string) => void;
  changeCoverPhoto: (uri: string) => Promise<{ ok: boolean; error?: string }>;
  setQrDesign: (designId: string) => void;
  reportPetLost: () => Promise<void>;
  markPetSafe: () => Promise<void>;
  markEmailVerified: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  assignPetQrCode: (input: { petQrCodeId: string; nextQrCodeId: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetLocalSession: () => Promise<void>;
};

const UserContext = createContext<UserContextValue>({
  owner: null,
  pets: [],
  pet: null,
  activePetQrCodeId: null,
  hydrated: false,
  setOwner: () => {},
  selectPet: () => {},
  isLoggedIn: false,
  registerUser: async () => {},
  addPet: async () => {},
  updatePetProfile: async () => {},
  loginWithEmail: async () => false,
  addPetMedia: async () => false,
  updatePetMediaCaption: () => {},
  removePetMedia: () => {},
  changeCoverPhoto: async () => ({ ok: false, error: 'Not signed in.' }),
  setQrDesign: () => {},
  reportPetLost: async () => {},
  markPetSafe: async () => {},
  markEmailVerified: async () => {},
  refreshProfile: async () => {},
  assignPetQrCode: async () => ({ ok: false, error: 'Not signed in.' }),
  logout: async () => {},
  deleteAccount: async () => {},
  resetLocalSession: async () => {},
});

function buildPetProfile(
  pet: Omit<PetProfile, 'media' | 'profileSlug' | 'qrCodeId' | 'qrDesignId' | 'isLost'> & {
    coverPhotoUri?: string | null;
    qrDesignId?: string;
    qrCodeId?: string;
    profileSlug?: string;
    isLost?: boolean;
  },
): PetProfile {
  const cover = pet.coverPhotoUri ?? null;
  const media: PetMediaItem[] = cover ? [createMediaItem(cover, 'photo')] : [];

  return {
    ...pet,
    coverPhotoUri: cover,
    media,
    qrCodeId: pet.qrCodeId ?? createQrCodeId(),
    profileSlug: pet.profileSlug ?? slugifyPetName(pet.name),
    qrDesignId: pet.qrDesignId ?? DEFAULT_QR_DESIGN_ID,
    isLost: pet.isLost ?? false,
    lostLatitude: pet.lostLatitude ?? null,
    lostLongitude: pet.lostLongitude ?? null,
  };
}

function getActivePet(pets: PetProfile[], activePetQrCodeId: string | null): PetProfile | null {
  if (pets.length === 0) return null;
  if (activePetQrCodeId) {
    const match = pets.find((p) => p.qrCodeId === activePetQrCodeId);
    if (match) return match;
  }
  return pets[0];
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [activePetQrCodeId, setActivePetQrCodeId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const pet = useMemo(() => getActivePet(pets, activePetQrCodeId), [pets, activePetQrCodeId]);

  const persistPets = useCallback(
    async (
      nextPets: PetProfile[],
      nextActiveId?: string | null,
      options?: { syncActivePet?: boolean },
    ) => {
      const snapshot = pets;
      setPets(nextPets);

      const resolvedActiveId =
        nextActiveId !== undefined
          ? nextActiveId
          : activePetQrCodeId && nextPets.some((p) => p.qrCodeId === activePetQrCodeId)
            ? activePetQrCodeId
            : (nextPets[0]?.qrCodeId ?? null);

      if (nextActiveId !== undefined || resolvedActiveId !== activePetQrCodeId) {
        setActivePetQrCodeId(resolvedActiveId);
      }

      if (!ownerId || !owner) return;

      try {
        const uploaded = await uploadPetsMedia(ownerId, nextPets);
        await upsertPets(ownerId, uploaded, owner.address, owner.city);
        setPets(uploaded);

        if (options?.syncActivePet !== false && owner.email) {
          await updateOwnerActivePet(owner.email, resolvedActiveId);
        }
      } catch (error) {
        setPets(snapshot);
        if (nextActiveId !== undefined || resolvedActiveId !== activePetQrCodeId) {
          setActivePetQrCodeId(
            snapshot.length > 0
              ? (snapshot.find((p) => p.qrCodeId === activePetQrCodeId)?.qrCodeId ??
                  snapshot[0]?.qrCodeId ??
                  null)
              : null,
          );
        }
        throw error;
      }
    },
    [activePetQrCodeId, owner, ownerId, pets],
  );

  const loginWithEmail = useCallback(async (email: string) => {
    const loaded = await loadOwnerProfile(email);
    if (!loaded) return false;

    const petsList = await fetchPetsByOwnerId(loaded.ownerId);
    const activeId = loaded.activePetQrCodeId ?? petsList[0]?.qrCodeId ?? null;

    setOwnerId(loaded.ownerId);
    setOwner(loaded.owner);
    setPets(petsList);
    setActivePetQrCodeId(activeId);
    setIsLoggedIn(true);
    await saveSessionEmail(email);

    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        if (!isSupabaseConfigured()) {
          return;
        }

        const email = await loadSessionEmail();
        if (email && !cancelled) {
          const ok = await loginWithEmail(email);
          if (!ok) {
            await clearSessionEmail();
          }
        }
      } catch (error) {
        logAppError('user.hydrate', error);
        await clearSessionEmail();
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [loginWithEmail]);

  const updateActivePet = useCallback(
    (updater: (current: PetProfile) => PetProfile) => {
      const active = getActivePet(pets, activePetQrCodeId);
      if (!active) return;
      const nextPets = pets.map((p) => (p.qrCodeId === active.qrCodeId ? updater(p) : p));
      void persistPets(nextPets).catch((error) => {
        console.error('Failed to save pet update', error);
      });
    },
    [activePetQrCodeId, persistPets, pets],
  );

  const markEmailVerified = async (email: string) => {
    await markOwnerEmailVerified(email);
  };

  const registerUser = async (
    ownerProfile: OwnerProfile,
    petInput: Omit<PetProfile, 'media' | 'profileSlug' | 'qrCodeId' | 'qrDesignId' | 'isLost'> & {
      coverPhotoUri?: string | null;
      qrDesignId?: string;
    },
  ) => {
    const petProfile = buildPetProfile(petInput);
    const id = await upsertOwner(ownerProfile, petProfile.qrCodeId, true);
    const uploaded = await uploadPetProfileMedia(id, petProfile);
    await upsertPet(id, uploaded, ownerProfile.address, ownerProfile.city);

    setOwnerId(id);
    setOwner(ownerProfile);
    setPets([uploaded]);
    setActivePetQrCodeId(uploaded.qrCodeId);
    setIsLoggedIn(true);
    await saveSessionEmail(ownerProfile.email);
  };

  const selectPet = (qrCodeId: string) => {
    if (!pets.some((p) => p.qrCodeId === qrCodeId)) return;
    setActivePetQrCodeId(qrCodeId);
    if (!owner?.email) return;
    void updateOwnerActivePet(owner.email, qrCodeId).catch((error) => {
      console.error('Failed to update active pet', error);
    });
  };

  const addPetMedia = async (uri: string, caption = '') => {
    const active = getActivePet(pets, activePetQrCodeId);
    if (!active) return false;

    const photoCount = active.media.filter((m) => m.type === 'photo').length;
    if (photoCount >= 8) return false;

    const item = createMediaItem(uri, 'photo', caption.trim() || undefined);
    const next: PetProfile = {
      ...active,
      media: [...active.media, item],
      coverPhotoUri: active.coverPhotoUri ?? uri,
    };
    const nextPets = pets.map((p) => (p.qrCodeId === active.qrCodeId ? next : p));

    try {
      await persistPets(nextPets);
      return true;
    } catch (error) {
      console.error('Failed to save media', error);
      return false;
    }
  };

  const updatePetMediaCaption = (mediaId: string, caption: string) => {
    updateActivePet((current) => ({
      ...current,
      media: current.media.map((item) =>
        item.id === mediaId ? { ...item, caption: caption.trim() || undefined } : item,
      ),
    }));
  };

  const removePetMedia = (id: string) => {
    updateActivePet((current) => {
      const removed = current.media.find((m) => m.id === id);
      const media = current.media.filter((m) => m.id !== id);
      const nextCover =
        removed?.uri === current.coverPhotoUri
          ? (media.find((m) => m.type === 'photo')?.uri ?? null)
          : current.coverPhotoUri;
      return { ...current, media, coverPhotoUri: nextCover };
    });
  };

  const changeCoverPhoto = async (uri: string) => {
    if (!isSupabaseConfigured()) {
      return {
        ok: false,
        error: getSupabaseReachabilityHint() ?? 'Supabase is not configured.',
      };
    }

    const active = getActivePet(pets, activePetQrCodeId);
    if (!active || !ownerId || !owner) {
      return { ok: false, error: 'Sign in to update your pet profile.' };
    }

    if (active.coverPhotoUri === uri) {
      return { ok: true };
    }

    const snapshot = pets;
    setPets((current) =>
      current.map((p) => (p.qrCodeId === active.qrCodeId ? { ...p, coverPhotoUri: uri } : p)),
    );

    try {
      let coverPhotoUri = uri;
      if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
        coverPhotoUri = await uploadLocalMediaUri(ownerId, active.qrCodeId, uri, 'photo', 'cover');
      }

      const updatedPet: PetProfile = { ...active, coverPhotoUri };
      await upsertPet(ownerId, updatedPet, owner.address, owner.city);

      setPets((current) =>
        current.map((p) => (p.qrCodeId === active.qrCodeId ? updatedPet : p)),
      );

      return { ok: true };
    } catch (error) {
      setPets(snapshot);
      logAppError('user.changeCoverPhoto', error);
      return {
        ok: false,
        error: getSupabaseNetworkErrorMessage(error, 'Could not update cover photo.'),
      };
    }
  };

  const setQrDesign = (designId: string) => {
    updateActivePet((current) => ({ ...current, qrDesignId: designId }));
  };

  const reportPetLost = async () => {
    const active = getActivePet(pets, activePetQrCodeId);
    if (!active || active.isLost || !owner) return;

    const coords = (await getCurrentCoordinates()) ?? null;
    const lostLatitude = coords?.latitude ?? null;
    const lostLongitude = coords?.longitude ?? null;

    try {
      if (coords && owner.email) {
        await updateOwnerLocation(owner.email, coords);
      }

      const nextPets = pets.map((p) =>
        p.qrCodeId === active.qrCodeId
          ? { ...p, isLost: true, lostLatitude, lostLongitude }
          : p,
      );
      await persistPets(nextPets, undefined, { syncActivePet: false });

      if (lostLatitude != null && lostLongitude != null) {
        const result = await broadcastLostPetAlert({
          reporterEmail: owner.email,
          pet: { ...active, isLost: true, lostLatitude, lostLongitude },
          lostLocation: { latitude: lostLatitude, longitude: lostLongitude },
        });
        console.log(
          `Lost pet broadcast: ${result.notified} nearby user(s), ${result.pushSent} push notification(s)`,
        );
      }
    } catch (error) {
      if (isMissingSchemaError(error)) {
        throw new Error(getMissingSchemaMessage(error));
      }
      throw error;
    }
  };

  const markPetSafe = async () => {
    const active = getActivePet(pets, activePetQrCodeId);
    if (!active || !active.isLost) return;

    const nextPets = pets.map((p) =>
      p.qrCodeId === active.qrCodeId
        ? { ...p, isLost: false, lostLatitude: null, lostLongitude: null }
        : p,
    );
    await persistPets(nextPets, undefined, { syncActivePet: false });
  };

  const addPet = async (
    petInput: Omit<PetProfile, 'media' | 'profileSlug' | 'qrCodeId' | 'qrDesignId' | 'isLost'> & {
      coverPhotoUri?: string | null;
      qrDesignId?: string;
    },
  ) => {
    if (!owner || !ownerId) return;
    const petProfile = buildPetProfile(petInput);
    await persistPets([...pets, petProfile], petProfile.qrCodeId);
  };

  const updatePetProfile = async (
    petInput: Omit<PetProfile, 'media' | 'profileSlug' | 'qrCodeId' | 'qrDesignId' | 'isLost'> & {
      coverPhotoUri?: string | null;
    },
  ) => {
    const active = getActivePet(pets, activePetQrCodeId);
    if (!active || !owner) return;

    const cover = petInput.coverPhotoUri ?? active.coverPhotoUri;
    const updated: PetProfile = {
      ...active,
      name: petInput.name,
      species: petInput.species,
      gender: petInput.gender,
      coat: petInput.coat,
      breed: petInput.breed,
      age: petInput.age,
      weight: petInput.weight,
      markings: petInput.markings,
      microchip: petInput.microchip,
      notes: petInput.notes,
      coverPhotoUri: cover,
      profileSlug: slugifyPetName(petInput.name),
    };

    const nextPets = pets.map((p) => (p.qrCodeId === active.qrCodeId ? updated : p));
    await persistPets(nextPets);
  };

  const refreshProfile = useCallback(async () => {
    if (!owner?.email || !isLoggedIn) return;

    const loaded = await loadOwnerProfile(owner.email);
    if (!loaded) return;

    const petsList = await fetchPetsByOwnerId(loaded.ownerId);
    const activeId = loaded.activePetQrCodeId ?? petsList[0]?.qrCodeId ?? null;

    setOwnerId(loaded.ownerId);
    setOwner(loaded.owner);
    setPets(petsList);
    setActivePetQrCodeId(activeId);
  }, [isLoggedIn, owner?.email]);

  const assignPetQrCode = useCallback(
    async (input: { petQrCodeId: string; nextQrCodeId: string }) => {
      if (!owner?.email || !ownerId) {
        return { ok: false, error: 'Sign in to update your QR code.' };
      }

      const targetPet = pets.find((entry) => entry.qrCodeId === input.petQrCodeId);
      if (!targetPet) {
        return { ok: false, error: 'Pet not found.' };
      }

      const parsed = parseQrCodeIdFromInput(input.nextQrCodeId);
      const validationError = parsed ? null : getQrCodeIdValidationError(input.nextQrCodeId);
      if (!parsed || validationError) {
        return { ok: false, error: validationError ?? 'Enter a valid QR code or profile link.' };
      }

      const normalized = normalizeQrCodeInput(parsed);
      if (normalized === targetPet.qrCodeId) {
        return { ok: true };
      }

      const snapshot = pets;
      const snapshotActive = activePetQrCodeId;
      const nextPets = pets.map((entry) =>
        entry.qrCodeId === targetPet.qrCodeId
          ? { ...entry, qrCodeId: normalized }
          : entry,
      );
      const nextActive =
        activePetQrCodeId === targetPet.qrCodeId ? normalized : activePetQrCodeId;

      setPets(nextPets);
      setActivePetQrCodeId(nextActive);

      try {
        await updatePetQrCodeId(ownerId, owner.email, targetPet.qrCodeId, normalized);
        return { ok: true };
      } catch (error) {
        setPets(snapshot);
        setActivePetQrCodeId(snapshotActive);
        logAppError('user.assignPetQrCode', error);
        return {
          ok: false,
          error: getErrorMessage(error, 'Could not save your QR code.'),
        };
      }
    },
    [activePetQrCodeId, owner, ownerId, pets],
  );

  const logout = async () => {
    setIsLoggedIn(false);
    setOwner(null);
    setOwnerId(null);
    setPets([]);
    setActivePetQrCodeId(null);
    await clearSessionEmail();
  };

  const resetLocalSession = logout;

  const deleteAccount = async () => {
    if (!owner?.email) return;
    await deleteAccountByEmail(owner.email);
    await logout();
  };

  return (
    <UserContext.Provider
      value={{
        owner,
        pets,
        pet,
        activePetQrCodeId,
        hydrated,
        setOwner,
        selectPet,
        isLoggedIn,
        registerUser,
        addPet,
        updatePetProfile,
        loginWithEmail,
        addPetMedia,
        updatePetMediaCaption,
        removePetMedia,
        changeCoverPhoto,
        setQrDesign,
        reportPetLost,
        markPetSafe,
        markEmailVerified,
        refreshProfile,
        assignPetQrCode,
        logout,
        deleteAccount,
        resetLocalSession,
      }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
