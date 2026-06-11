import { getWebBaseUrl } from '@/lib/pet-url';

export const QR_CODE_ID_MIN = 3;
export const QR_CODE_ID_MAX = 40;
const QR_CODE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export function normalizeQrCodeInput(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidQrCodeId(id: string): boolean {
  return (
    id.length >= QR_CODE_ID_MIN &&
    id.length <= QR_CODE_ID_MAX &&
    QR_CODE_ID_PATTERN.test(id)
  );
}

export function getQrCodeIdValidationError(input: string): string | null {
  const normalized = normalizeQrCodeInput(input);
  if (!normalized) return 'Enter a QR code.';
  if (normalized.length < QR_CODE_ID_MIN) {
    return `Use at least ${QR_CODE_ID_MIN} characters.`;
  }
  if (normalized.length > QR_CODE_ID_MAX) {
    return `Use at most ${QR_CODE_ID_MAX} characters.`;
  }
  if (!QR_CODE_ID_PATTERN.test(normalized)) {
    return 'Use letters, numbers, hyphens, or underscores only.';
  }
  return null;
}

/** Parse a pasted id or profile URL into a normalized QR code id. */
export function parseQrCodeIdFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const direct = normalizeQrCodeInput(trimmed);
  if (isValidQrCodeId(direct)) return direct;

  const candidates = [trimmed];
  if (trimmed.startsWith('pettag://')) {
    candidates.push(trimmed.replace(/^pettag:\/\//, `${getWebBaseUrl()}/`));
  }

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      const match = url.pathname.match(/\/pet\/([^/?#]+)/i);
      if (!match?.[1]) continue;
      const slug = normalizeQrCodeInput(decodeURIComponent(match[1]));
      if (isValidQrCodeId(slug)) return slug;
    } catch {
      // not a URL
    }
  }

  return null;
}
