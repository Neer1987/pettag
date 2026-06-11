import * as Linking from 'expo-linking';
import { useEffect, useRef } from 'react';

import { openPetProfileFromScan, parsePetQrCodeId } from '@/lib/pet-link';
import { useUser } from '@/contexts/user-context';

/** Routes PetTag QR deep links (https://pettag.app/pet/… or pettag://pet/…) into the app. */
export function PetLinkRouter() {
  const { pets, hydrated } = useUser();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    const ownPetQrCodeIds = pets.map((pet) => pet.qrCodeId);

    const handleUrl = (url: string | null) => {
      if (!url || handledRef.current === url) return;

      // Expo Router handles https universal links; we only normalize the custom scheme here.
      if (url.startsWith('http://') || url.startsWith('https://')) return;

      const qrCodeId = parsePetQrCodeId(url);
      if (!qrCodeId) return;

      handledRef.current = url;
      openPetProfileFromScan(qrCodeId, { ownPetQrCodeIds, replace: false });
    };

    void Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handledRef.current = null;
      handleUrl(url);
    });

    return () => subscription.remove();
  }, [hydrated, pets]);

  return null;
}
