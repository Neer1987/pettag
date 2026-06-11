import { fetchOwnerByEmail } from '@/lib/supabase/owners';
import { sendInboxPushNotification, type InboxPushKind } from '@/lib/push/expo-push';

export async function notifyMessageRecipient(input: {
  recipientEmail: string;
  petName: string;
  petQrCodeId: string;
  senderName: string;
  body: string;
  kind?: InboxPushKind;
}): Promise<void> {
  const email = input.recipientEmail.trim().toLowerCase();
  if (!email) return;

  const recipient = await fetchOwnerByEmail(email);
  if (!recipient?.push_token) return;

  await sendInboxPushNotification({
    pushToken: recipient.push_token,
    petName: input.petName,
    petQrCodeId: input.petQrCodeId,
    senderName: input.senderName,
    body: input.body,
    kind: input.kind ?? 'inbox_message',
  });
}
