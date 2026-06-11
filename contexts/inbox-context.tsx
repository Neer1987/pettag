import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';

import { useUser } from '@/contexts/user-context';
import { getErrorMessage, logAppError } from '@/lib/errors';
import { showInboxMessageNotification } from '@/lib/notifications';
import { notifyMessageRecipient } from '@/lib/supabase/message-notify';
import {
  deleteMessage as deleteMessageDb,
  fetchMessagesForRecipient,
  insertMessage,
  markAllMessagesRead as markAllMessagesReadDb,
  markMessageRead,
  markMessageUnread,
} from '@/lib/supabase/messages';

export type InboxMessage = {
  id: string;
  recipientEmail: string;
  petName: string;
  petSlug: string;
  senderName: string;
  senderEmail: string;
  body: string;
  createdAt: number;
  read: boolean;
};

type SendMessageInput = {
  recipientEmail: string;
  petName: string;
  petSlug: string;
  senderName: string;
  senderEmail: string;
  body: string;
  notifyKind?: 'pet_found' | 'inbox_reply' | 'inbox_message';
};

type InboxContextValue = {
  messages: InboxMessage[];
  loading: boolean;
  error: string | null;
  unreadCount: (email: string | undefined) => number;
  messagesFor: (email: string | undefined) => InboxMessage[];
  sendMessage: (input: SendMessageInput) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markUnread: (id: string) => Promise<void>;
  markAllRead: (email: string) => Promise<void>;
  replyInApp: (input: { toMessage: InboxMessage; body: string }) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const InboxContext = createContext<InboxContextValue>({
  messages: [],
  loading: false,
  error: null,
  unreadCount: () => 0,
  messagesFor: () => [],
  sendMessage: async () => {},
  markRead: async () => {},
  markUnread: async () => {},
  markAllRead: async () => {},
  replyInApp: async () => {},
  deleteMessage: async () => {},
  refresh: async () => {},
});

const NOTIFIED_MESSAGES_KEY = '@pettag/notified_message_ids';

async function loadNotifiedMessageIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFIED_MESSAGES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

async function saveNotifiedMessageIds(ids: Set<string>) {
  const trimmed = [...ids].slice(-200);
  await AsyncStorage.setItem(NOTIFIED_MESSAGES_KEY, JSON.stringify(trimmed));
}

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const { owner, isLoggedIn } = useUser();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const inboxInitializedRef = useRef(false);

  const notifyForNewMessages = useCallback(async (rows: InboxMessage[]) => {
    const known = knownMessageIdsRef.current;

    for (const row of rows) {
      if (known.has(row.id)) continue;

      known.add(row.id);

      if (inboxInitializedRef.current && !row.read && AppState.currentState === 'active') {
        await showInboxMessageNotification({
          petName: row.petName,
          senderName: row.senderName,
          body: row.body,
          petQrCodeId: row.petSlug,
          kind: 'inbox_message',
        });
      }
    }

    await saveNotifiedMessageIds(known);
  }, []);

  const refresh = useCallback(async () => {
    if (!owner?.email || !isLoggedIn) {
      setMessages([]);
      setError(null);
      inboxInitializedRef.current = false;
      knownMessageIdsRef.current = new Set();
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchMessagesForRecipient(owner.email);
      await notifyForNewMessages(rows);
      inboxInitializedRef.current = true;
      setMessages(rows);
      setError(null);
    } catch (err) {
      logAppError('inbox.refresh', err);
      setError(getErrorMessage(err, 'Could not load inbox messages.'));
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, notifyForNewMessages, owner?.email]);

  useEffect(() => {
    void loadNotifiedMessageIds().then((ids) => {
      knownMessageIdsRef.current = ids;
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isLoggedIn || !owner?.email) return;

    const interval = setInterval(() => {
      void refresh();
    }, 45000);

    const onStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void refresh();
      }
    };

    const received = Notifications.addNotificationReceivedListener(() => {
      void refresh();
    });

    const sub = AppState.addEventListener('change', onStateChange);
    return () => {
      clearInterval(interval);
      sub.remove();
      received.remove();
    };
  }, [isLoggedIn, owner?.email, refresh]);

  const sendMessage = async (input: SendMessageInput) => {
    const item = await insertMessage(input);
    const kind = input.notifyKind ?? 'inbox_message';

    try {
      await notifyMessageRecipient({
        recipientEmail: input.recipientEmail,
        petName: input.petName,
        petQrCodeId: input.petSlug,
        senderName: input.senderName,
        body: input.body,
        kind,
      });
    } catch (err) {
      logAppError('inbox.notifyRecipient', err);
    }

    if (owner?.email && item.recipientEmail === owner.email.trim().toLowerCase()) {
      knownMessageIdsRef.current.add(item.id);
      setMessages((prev) => [item, ...prev]);
    }
  };

  const markRead = async (id: string) => {
    await markMessageRead(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };

  const markUnread = async (id: string) => {
    await markMessageUnread(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: false } : m)));
  };

  const markAllRead = async (email: string) => {
    await markAllMessagesReadDb(email);
    const key = email.trim().toLowerCase();
    setMessages((prev) =>
      prev.map((m) => (m.recipientEmail === key ? { ...m, read: true } : m)),
    );
  };

  const replyInApp = async (input: { toMessage: InboxMessage; body: string }) => {
    if (!owner?.email) throw new Error('Sign in to reply');

    const finderEmail = input.toMessage.senderEmail?.trim().toLowerCase();
    if (!finderEmail) {
      throw new Error('This finder did not leave a PetTag contact email for in-app replies.');
    }

    await sendMessage({
      recipientEmail: finderEmail,
      petName: input.toMessage.petName,
      petSlug: input.toMessage.petSlug,
      senderName: owner.fullName,
      senderEmail: owner.email,
      body: input.body,
      notifyKind: 'inbox_reply',
    });
  };

  const deleteMessage = async (id: string) => {
    await deleteMessageDb(id);
    knownMessageIdsRef.current.delete(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const messagesFor = (email: string | undefined) => {
    if (!email) return [];
    const key = email.trim().toLowerCase();
    return messages.filter((m) => m.recipientEmail === key);
  };

  const unreadCount = (email: string | undefined) =>
    messagesFor(email).filter((m) => !m.read).length;

  const value = useMemo(
    () => ({
      messages,
      loading,
      error,
      unreadCount,
      messagesFor,
      sendMessage,
      markRead,
      markUnread,
      markAllRead,
      replyInApp,
      deleteMessage,
      refresh,
    }),
    [error, loading, messages, refresh],
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox() {
  return useContext(InboxContext);
}
