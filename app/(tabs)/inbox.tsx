import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { useInbox, type InboxMessage } from '@/contexts/inbox-context';
import { useToast } from '@/contexts/toast-context';
import { useUser } from '@/contexts/user-context';
import { getErrorMessage } from '@/lib/errors';
import { useAppRefresh } from '@/hooks/use-app-refresh';

type InboxFilter = 'all' | 'unread' | 'read';

const filters: { key: InboxFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
];

function formatWhen(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { owner, isLoggedIn } = useUser();
  const {
    messages,
    loading,
    error,
    unreadCount,
    markRead,
    markUnread,
    markAllRead,
    replyInApp,
    deleteMessage,
    refresh,
  } = useInbox();
  const { refreshAll } = useAppRefresh();

  const [filter, setFilter] = useState<InboxFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const inboxMessages = useMemo(() => {
    const email = owner?.email?.trim().toLowerCase();
    if (!email) return [];
    return messages.filter((m) => m.recipientEmail === email);
  }, [messages, owner?.email]);

  const filteredMessages = useMemo(() => {
    if (filter === 'unread') return inboxMessages.filter((m) => !m.read);
    if (filter === 'read') return inboxMessages.filter((m) => m.read);
    return inboxMessages;
  }, [filter, inboxMessages]);

  const selected = filteredMessages.find((m) => m.id === selectedId) ?? inboxMessages.find((m) => m.id === selectedId) ?? null;
  const unread = unreadCount(owner?.email);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  };

  const openMessage = async (message: InboxMessage) => {
    setSelectedId(message.id);
    setReplyText('');
    if (!message.read) {
      try {
        await markRead(message.id);
      } catch (err) {
        showToast(getErrorMessage(err, 'Could not mark message as read'));
      }
    }
  };

  const handleSendReply = async () => {
    if (!selected) return;
    if (!replyText.trim()) {
      showToast('Write a reply first');
      return;
    }

    setSendingReply(true);
    try {
      await replyInApp({ toMessage: selected, body: replyText.trim() });
      showToast('Reply sent in PetTag — finder will be notified in their inbox');
      setReplyText('');
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not send reply'));
    } finally {
      setSendingReply(false);
    }
  };

  const handleDelete = () => {
    if (!selected) return;

    Alert.alert(
      'Delete message?',
      'This removes the message from your inbox permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(selected.id);
              setSelectedId(null);
              setReplyText('');
              showToast('Message deleted');
            } catch (err) {
              showToast(getErrorMessage(err, 'Could not delete message'));
            }
          },
        },
      ],
    );
  };

  const handleMarkUnread = async () => {
    if (!selected) return;
    try {
      await markUnread(selected.id);
      showToast('Marked as unread');
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not update message'));
    }
  };

  const handleMarkAllRead = async () => {
    if (!owner?.email) return;
    try {
      await markAllRead(owner.email);
      showToast('All messages marked as read');
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not update messages'));
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + 24 }]}>
        <StatusBar style="dark" />
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>Sign in to view inbox</Text>
        <Text style={styles.emptySub}>Messages from finders appear here when you are logged in.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Messages</Text>
          <Text style={styles.title}>Inbox</Text>
        </View>
        {unread > 0 ? (
          <View style={styles.unreadPill}>
            <Text style={styles.unreadPillText}>{unread} unread</Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <ErrorState message={error} onRetry={() => void refresh()} compact />
      ) : null}

      <View style={styles.filterRow}>
        {filters.map((item) => {
          const active = filter === item.key;
          const count =
            item.key === 'all'
              ? inboxMessages.length
              : item.key === 'unread'
                ? unread
                : inboxMessages.length - unread;

          return (
            <Pressable
              key={item.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}>
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {item.label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {unread > 0 ? (
        <Pressable style={styles.markAllBtn} onPress={() => void handleMarkAllRead()}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </Pressable>
      ) : null}

      {loading && inboxMessages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.forest} />
        </View>
      ) : filteredMessages.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>{filter === 'unread' ? '✓' : '📭'}</Text>
          <Text style={styles.emptyTitle}>
            {filter === 'unread' ? 'No unread messages' : filter === 'read' ? 'No read messages' : 'Inbox is empty'}
          </Text>
          <Text style={styles.emptySub}>
            {filter === 'all'
              ? 'When someone finds your pet, their message will show up here.'
              : 'Try another filter to see more messages.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={Colors.forest} />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + (selected ? 340 : 24), paddingHorizontal: 20 }}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedId;
            return (
              <Pressable
                style={[
                  styles.messageCard,
                  !item.read && styles.messageCardUnread,
                  isSelected && styles.messageCardSelected,
                ]}
                onPress={() => void openMessage(item)}>
                <View style={styles.messageTop}>
                  <View style={styles.messageTitleRow}>
                    {!item.read ? <View style={styles.unreadDot} /> : null}
                    <Text style={[styles.senderName, !item.read && styles.senderNameUnread]}>{item.senderName}</Text>
                  </View>
                  <Text style={styles.when}>{formatWhen(item.createdAt)}</Text>
                </View>
                <Text style={styles.petLine}>Re: {item.petName}</Text>
                <Text style={styles.preview} numberOfLines={2}>
                  {item.body}
                </Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusBadge, item.read ? styles.readBadge : styles.unreadBadge]}>
                    <Text style={[styles.statusBadgeText, item.read ? styles.readBadgeText : styles.unreadBadgeText]}>
                      {item.read ? 'Read' : 'Unread'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {selected ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.detailSheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{selected.senderName}</Text>
            <Pressable
              onPress={() => {
                setSelectedId(null);
                setReplyText('');
              }}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <Text style={styles.detailMeta}>
            Re: {selected.petName} · {formatWhen(selected.createdAt)}
          </Text>
          <Text style={styles.detailBody}>{selected.body}</Text>

          <View style={styles.replyBlock}>
            <Text style={styles.replyLabel}>Reply in PetTag</Text>
            {selected.senderEmail ? (
              <Text style={styles.replyHint}>
                Your reply stays in the app and notifies {selected.senderName} in their PetTag inbox.
              </Text>
            ) : (
              <Text style={styles.replyHintUnavailable}>
                This finder did not add a contact email, so in-app reply is not available.
              </Text>
            )}
            <TextInput
              style={styles.replyInput}
              placeholder={`Message ${selected.senderName}…`}
              placeholderTextColor={Colors.light}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              textAlignVertical="top"
              editable={Boolean(selected.senderEmail) && !sendingReply}
            />
            <Button
              label={sendingReply ? 'Sending…' : 'Send reply'}
              variant="forest"
              onPress={() => void handleSendReply()}
              style={styles.detailBtn}
              disabled={!selected.senderEmail || sendingReply}
            />
          </View>

          <View style={styles.detailActions}>
            {selected.read ? (
              <Button label="Mark unread" variant="ghost" onPress={() => void handleMarkUnread()} style={styles.detailBtn} />
            ) : null}
            <Button label="Delete message" variant="ghost" onPress={handleDelete} style={styles.detailBtn} />
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  eyebrow: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.forest,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: { fontFamily: Fonts.serifItalic, fontSize: 32, color: Colors.ink },
  unreadPill: {
    backgroundColor: Colors.successPale,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  unreadPillText: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.success },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  filterChipActive: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forest,
  },
  filterText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.mid },
  filterTextActive: { color: Colors.white },
  markAllBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  markAllText: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.forest },
  messageCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Shadows.card,
  },
  messageCardUnread: {
    borderColor: Colors.forest,
    backgroundColor: '#f8fbf9',
  },
  messageCardSelected: {
    borderColor: Colors.gold,
  },
  messageTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  messageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.forest,
  },
  senderName: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.ink },
  senderNameUnread: { fontFamily: Fonts.sansSemiBold },
  when: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.light },
  petLine: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.forest, marginBottom: 4 },
  preview: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mid, lineHeight: 20 },
  statusRow: { marginTop: 10 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  unreadBadge: { backgroundColor: Colors.forest },
  readBadge: { backgroundColor: Colors.cream2 },
  statusBadgeText: { fontFamily: Fonts.sansSemiBold, fontSize: 10 },
  unreadBadgeText: { color: Colors.white },
  readBadgeText: { color: Colors.mid },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.serifItalic, fontSize: 24, color: Colors.ink, marginBottom: 6, textAlign: 'center' },
  emptySub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    textAlign: 'center',
    lineHeight: 22,
  },
  detailSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    ...Shadows.card,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailTitle: { fontFamily: Fonts.serifItalic, fontSize: 22, color: Colors.ink },
  closeText: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.forest },
  detailMeta: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mid, marginBottom: 8 },
  detailBody: { fontFamily: Fonts.sans, fontSize: 15, color: Colors.ink, lineHeight: 24, marginBottom: 12 },
  replyBlock: {
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    paddingTop: 14,
    marginBottom: 4,
  },
  replyLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 4,
  },
  replyHint: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.mid,
    lineHeight: 18,
    marginBottom: 10,
  },
  replyHintUnavailable: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.danger,
    lineHeight: 18,
    marginBottom: 10,
  },
  replyInput: {
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
    minHeight: 88,
    marginBottom: 10,
  },
  detailActions: { marginTop: 8, gap: 4 },
  detailBtn: { paddingVertical: 12 },
});
