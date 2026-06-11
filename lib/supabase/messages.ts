import type { InboxMessage } from '@/contexts/inbox-context';
import { getSupabase } from '@/lib/supabase/client';
import type { MessageRow } from '@/lib/supabase/types';

function rowToMessage(row: MessageRow): InboxMessage {
  return {
    id: row.id,
    recipientEmail: row.recipient_email,
    petName: row.pet_name,
    petSlug: row.pet_qr_code_id,
    senderName: row.sender_name,
    senderEmail: row.sender_email,
    body: row.body,
    createdAt: new Date(row.created_at).getTime(),
    read: row.read,
  };
}

export async function fetchMessagesForRecipient(recipientEmail: string): Promise<InboxMessage[]> {
  const supabase = getSupabase();
  const key = recipientEmail.trim().toLowerCase();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('recipient_email', key)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToMessage);
}

export async function insertMessage(input: {
  recipientEmail: string;
  petName: string;
  petSlug: string;
  senderName: string;
  senderEmail: string;
  body: string;
}): Promise<InboxMessage> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      recipient_email: input.recipientEmail.trim().toLowerCase(),
      pet_qr_code_id: input.petSlug,
      pet_name: input.petName,
      sender_name: input.senderName.trim(),
      sender_email: input.senderEmail.trim(),
      body: input.body.trim(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return rowToMessage(data);
}

export async function markMessageRead(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('messages').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markMessageUnread(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('messages').update({ read: false }).eq('id', id);
  if (error) throw error;
}

export async function markAllMessagesRead(recipientEmail: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('recipient_email', recipientEmail.trim().toLowerCase());

  if (error) throw error;
}

export async function deleteMessage(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) throw error;
}
