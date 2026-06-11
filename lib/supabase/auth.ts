import { getSupabase } from '@/lib/supabase/client';

const OTP_TTL_MINUTES = 15;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Dev fallback when DB insert fails — still allows 123456 in verifyOtpCode */
export const DEV_FALLBACK_OTP = '123456';

export async function sendOtpToEmail(email: string): Promise<string> {
  const supabase = getSupabase();
  const key = normalizeEmail(email);
  const code = __DEV__ ? DEV_FALLBACK_OTP : generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  await supabase.from('otp_codes').delete().eq('email', key);

  const { error } = await supabase.from('otp_codes').insert({
    email: key,
    code,
    expires_at: expiresAt,
  });

  if (error) throw error;

  // TODO: send email via Supabase Edge Function / Resend
  return code;
}

export async function verifyOtpCode(email: string, code: string): Promise<boolean> {
  const trimmed = code.trim();
  const key = normalizeEmail(email);

  if (__DEV__ && trimmed === DEV_FALLBACK_OTP) {
    return true;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('email', key)
    .eq('code', trimmed)
    .maybeSingle();

  if (error || !data) return false;

  if (new Date(data.expires_at).getTime() < Date.now()) {
    await supabase.from('otp_codes').delete().eq('email', key).eq('code', trimmed);
    return false;
  }

  await supabase.from('otp_codes').delete().eq('email', key);
  return true;
}
