const PRODUCTION_ORIGIN = 'https://pettag.app';

export function createQrCodeId(): string {
  return `pt-${Math.random().toString(36).slice(2, 6)}${Date.now().toString(36).slice(-4)}`;
}

/** Base URL finders open in a browser — no app install required. */
export function getWebBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return PRODUCTION_ORIGIN;
}

/** URL encoded in every pet QR code. Opens in the PetTag app when installed, otherwise the web profile. */
export function getPetScanUrl(qrCodeId: string): string {
  return `${getWebBaseUrl()}/pet/${qrCodeId}`;
}

export function getPetProfileUrl(qrCodeId: string): string {
  return getPetScanUrl(qrCodeId);
}

export function getPetProfilePath(qrCodeId: string): string {
  const base = getWebBaseUrl().replace(/^https?:\/\//, '');
  return `${base}/pet/${qrCodeId}`;
}

export function getPetProfileRoute(qrCodeId: string): `/pet/${string}` {
  return `/pet/${qrCodeId}`;
}
