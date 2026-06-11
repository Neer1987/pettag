import { deleteAlertNotificationsForOwner } from '@/lib/supabase/alerts';
import { fetchOwnerByEmail } from '@/lib/supabase/owners';
import { getSupabase } from '@/lib/supabase/client';
import { deleteOwnerStorage } from '@/lib/supabase/storage';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function deleteMessagesForRecipient(email: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('recipient_email', normalizeEmail(email));

  if (error) throw error;
}

async function deleteOtpCodesForEmail(email: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('otp_codes').delete().eq('email', normalizeEmail(email));

  if (error) throw error;
}

/** Permanently deletes the owner, pets (cascade), messages, OTP codes, and storage media. */
export async function deleteAccountByEmail(email: string): Promise<void> {
  const owner = await fetchOwnerByEmail(email);
  if (!owner) return;

  await deleteOwnerStorage(owner.id);
  await deleteMessagesForRecipient(email);
  await deleteOtpCodesForEmail(email);
  await deleteAlertNotificationsForOwner(email);

  const supabase = getSupabase();
  const { error } = await supabase.from('owners').delete().eq('id', owner.id);
  if (error) throw error;
}
