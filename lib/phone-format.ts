/** Format digits as US phone: 641-451-4761 */
export function formatUSPhone(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function getPhoneDigits(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

export function isValidUSPhone(formatted: string): boolean {
  return getPhoneDigits(formatted).length === 10;
}
