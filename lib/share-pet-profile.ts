import { Platform, Share } from 'react-native';

import { getPetProfilePath, getPetScanUrl } from '@/lib/pet-url';

export type SharePetProfileInput = {
  petName: string;
  qrCodeId: string;
  isLost?: boolean;
  ownerPhone?: string;
  breed?: string;
};

export function buildPetProfileShareMessage(input: SharePetProfileInput): string {
  const url = getPetScanUrl(input.qrCodeId);
  const details = [input.breed?.trim()].filter(Boolean).join(' · ');

  if (input.isLost) {
    const contact = input.ownerPhone?.trim()
      ? ` Contact: ${input.ownerPhone.trim()}.`
      : '';
    return `MISSING PET — Please help find ${input.petName}${details ? ` (${details})` : ''}!${contact}\n\nView profile & report a sighting:\n${url}`;
  }

  return `Meet ${input.petName}${details ? ` — ${details}` : ''} on PetTag.\n\nScan or open their profile:\n${url}`;
}

async function copyText(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  throw new Error('Could not copy link on this device.');
}

export async function sharePetProfile(
  input: SharePetProfileInput,
): Promise<'shared' | 'copied' | 'dismissed'> {
  const url = getPetScanUrl(input.qrCodeId);
  const message = buildPetProfileShareMessage(input);
  const title = input.isLost ? `Missing: ${input.petName}` : `${input.petName} on PetTag`;

  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: message, url });
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return 'dismissed';
        }
      }
    }

    await copyText(url);
    return 'copied';
  }

  const payload =
    Platform.OS === 'ios'
      ? { message: `${message}\n`, url, subject: title }
      : { message, title };

  const result = await Share.share(payload);
  if (result.action === Share.dismissedAction) {
    return 'dismissed';
  }

  return 'shared';
}
