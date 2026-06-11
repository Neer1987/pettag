import { router } from 'expo-router';

import { parseQrCodeIdFromInput } from '@/lib/qr-code-id';

export { isValidQrCodeId, normalizeQrCodeInput, parseQrCodeIdFromInput } from '@/lib/qr-code-id';

/** Extract a pet QR code id from a scanned URL, deep link, or raw id. */
export function parsePetQrCodeId(input: string): string | null {
  return parseQrCodeIdFromInput(input);
}

type OpenPetProfileOptions = {
  ownPetQrCodeIds?: string[];
  /** When true, replace stack (e.g. after QR scan). */
  replace?: boolean;
};

/** Open a scanned or linked pet profile inside the PetTag app. */
export function openPetProfileFromScan(qrCodeId: string, options: OpenPetProfileOptions = {}) {
  const route = `/pet/${qrCodeId}` as const;

  if (options.ownPetQrCodeIds?.includes(qrCodeId)) {
    if (options.replace) {
      router.replace('/(tabs)/pets');
    } else {
      router.push('/(tabs)/pets');
    }
    return;
  }

  if (options.replace) {
    router.replace(route);
    return;
  }

  router.push(route);
}

export function openPetQrScanner() {
  router.push('/scan-qr');
}
