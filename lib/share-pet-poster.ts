import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import type { RefObject } from 'react';
import type { View } from 'react-native';

import { buildPetProfileShareMessage, sharePetProfile, type SharePetProfileInput } from '@/lib/share-pet-profile';

export async function capturePosterImage(viewRef: RefObject<View | null>): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Poster image sharing is available in the PetTag mobile app.');
  }

  if (!viewRef.current) {
    throw new Error('Poster is still loading. Try again in a moment.');
  }

  return captureRef(viewRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
}

export async function sharePosterImage(viewRef: RefObject<View | null>): Promise<void> {
  const uri = await capturePosterImage(viewRef);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Share pet poster',
    UTI: 'public.png',
  });
}

export async function sharePosterFallback(input: SharePetProfileInput): Promise<'shared' | 'copied' | 'dismissed'> {
  if (Platform.OS === 'web') {
    const message = buildPetProfileShareMessage(input);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: input.isLost ? `Missing: ${input.petName}` : `${input.petName} poster`,
          text: message,
        });
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return 'dismissed';
        }
      }
    }
  }

  return sharePetProfile(input);
}
