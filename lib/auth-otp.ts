export { DEV_FALLBACK_OTP as TEST_OTP, sendOtpToEmail, verifyOtpCode } from '@/lib/supabase/auth';

export const OTP_LENGTH = 6;

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
